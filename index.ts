import * as env from "./env-vars";

import logger from "./logger";
import { auth, flushOrders, getObservedOrder, getPairData, onOrdersNotify, prepareDatabaseStructure, prepareThreadSocket, startActivityChecker, startThreadsFromConfig, syncDatabaseWithConfig, threadRestartChecker } from "./utils/utils";
import { ConfigItemParsed } from "./interfaces/common/Config";
import sequelize from "./database/database";
import { addActiveThread, state } from "./utils/states";
import { NotificationParams } from "./interfaces/common/Common";
import { destroyThread } from "./utils/utils";
import ParserHandler from "./utils/dex_parsers/parserHandler";
import telegramHandler from "./utils/telegramHandler";

export async function thread(configItem: ConfigItemParsed) {

    // connect socket
    const { socketClient, activeThreadData } = await prepareThreadSocket();
    addActiveThread(activeThreadData)

    logger.info(`Starting thread with id ${activeThreadData.id}...`);

    // auth and create/find order
    const { tradeAuthToken } = await auth();
    await flushOrders(configItem.pairId, tradeAuthToken).catch(e => console.log(e));

    logger.detailedInfo("Getting observed order...");
    const observedOrderId = await getObservedOrder(tradeAuthToken, configItem).catch(err => {
        logger.error(`Error getting observed order: ${err}`);
        return null;
    });

    if (!observedOrderId) {
        logger.error("No observed order found. Exiting thread...");
        return;
    }

    logger.detailedInfo(`Observed order id: ${observedOrderId}`);



    // continuously ping trade server and check for disconnects
    startActivityChecker(activeThreadData, observedOrderId, tradeAuthToken);
    threadRestartChecker(activeThreadData, () => {
        thread(configItem);
    });


    // get pair data
    logger.detailedInfo("Fetching trading pair data...");
    const pairData = await getPairData(configItem.pairId);
    const notificationParams: NotificationParams = [
        tradeAuthToken, observedOrderId, pairData, configItem.trade_id,
        configItem
    ];




    // initial check for matches and set WS listeners
    await onOrdersNotify(...notificationParams);
    await socketClient.setSocketListeners(
        configItem,
        notificationParams,
        activeThreadData
    );

    logger.info("Bot started.");
}

async function startWithParser(configItem: ConfigItemParsed) {

    if (!configItem.parser_config) {
        throw new Error("Parser config is missing in parser start (unexpected).");
    }

    const parserHandler = new ParserHandler({
        config: configItem.parser_config
    });

    await parserHandler.init();

    const marketState = parserHandler.getMarketState();
    const preparedConfig = parserHandler.getConfigWithLivePrice(marketState, configItem);

    async function updateConfig() {

        logger.detailedInfo("Destroying threads...");

        const cachedActiveThreads = JSON.parse(JSON.stringify(state.activeThreads.map(e => ({
            id: e.id
        }))));

        for (const thread of cachedActiveThreads) {
            logger.warn(`Destroying thread ${thread.id}...`);
            destroyThread(thread.id);
        }

        logger.info("All threads destroyed!");


        const marketState = parserHandler.getMarketState();
        const preparedConfig = parserHandler.getConfigWithLivePrice(marketState, configItem);

        if (!preparedConfig) {
            logger.error("Prepared config is false, not starting threads.");
            return;
        }

        const { tradeAuthToken } = await auth();

        await flushOrders(preparedConfig.pairId, tradeAuthToken);

        await startThreadsFromConfig([preparedConfig]);
    }

    parserHandler.setPriceChangeListener(updateConfig, configItem);
}

(async () => {

    await sequelize.sync({});
    await prepareDatabaseStructure();
    await syncDatabaseWithConfig();
    logger.detailedInfo("Database synced!");

    if (env.TELEGRAM_BOT_TOKEN) {
        await telegramHandler.init();
    }

    const configWithParser = env.readConfig.filter(e => e.parser_config);
    const configWithoutParser = env.readConfig.filter(e => !e.parser_config);

    if (configWithoutParser.length > 0) {
        await startThreadsFromConfig(configWithoutParser);
    }

    for (const element of configWithParser) {
        startWithParser(element);
    }

})();
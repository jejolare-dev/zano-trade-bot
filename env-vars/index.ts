import "dotenv/config";
import Decimal from "decimal.js";
import { URL } from "url";
import OfferType from "../interfaces/common/OfferType";
import fs from "fs";
import { ConfigItem, ConfigParsed } from "../interfaces/common/Config";
import { allowedParserTypes, ParserType } from "../interfaces/common/Common";

const intRegexp = /^[0-9]+$/;

function numToDecimal(envVar: string, envVarName: string) {
    try {
        return new Decimal(envVar);
    } catch {
        throw new Error(`${envVarName} is not numeric`);
    }
}

function envToInt(envVar: string, envVarName: string) {
    const errMsg = `${envVarName} .env variable is not positive integer value`;

    if (!intRegexp.test(envVar)) {
        throw new Error(errMsg);
    }

    const int = parseInt(envVar, 10);

    if (isNaN(int)) {
        throw new Error(errMsg);
    }

    return int;
}

function idFromPairUrl(stringUrl: string) {
    const parsedUrl = new URL(stringUrl);

    const pairIdStr = parsedUrl.pathname.split("/").filter(e => !!e).at(-1);

    if (!pairIdStr || !intRegexp.test(pairIdStr)) {
        throw new Error("PAIR_URL is not valid");
    }

    const pairId = parseInt(pairIdStr, 10);

    if (isNaN(pairId)) {
        throw new Error("PAIR_URL is not valid");
    }

    return pairId;
}


if (!process.env.ZANOD_URL) {
    throw new Error("ZANOD_URL is not specified in .env file");
}

export const SIMPLEWALLET_PORT = process.env.SIMPLEWALLET_PORT
    ? envToInt(process.env.SIMPLEWALLET_PORT, "SIMPLEWALLET_PORT")
    : undefined;

export const CUSTOM_SERVER = process.env.CUSTOM_SERVER || "https://trade.zano.org";
export const API_TOKEN = process.env.API_TOKEN || "";

export const ZANOD_URL = process.env.ZANOD_URL.endsWith("/") ? process.env.ZANOD_URL.slice(0, -1) : process.env.ZANOD_URL;

export const DISABLE_INFO_LOGS = process.env.DISABLE_INFO_LOGS === "true";

export const readConfig: ConfigParsed = (() => {
    try {
        const config = JSON.parse(fs.readFileSync("./config/config.json", "utf-8"));

        const preparedConfig = config.map((item: ConfigItem, index: number) => {
            const parsedAmount = numToDecimal(item.amount, `CONFIG[${index}].amount`);
            const parsedPrice = numToDecimal(item.price, `CONFIG[${index}].price`);
            const parsedType = item.type.toLowerCase() === "buy" ? "buy" : "sell" as OfferType;
            const parsedPairUrl = idFromPairUrl(item.pair_url);

            const trade_id = item.trade_id || null;

            const PRICE_INTERVAL_SEC = parseInt(item.parser_config?.PRICE_INTERVAL_SEC || "10", 10);
            const PRICE_SELL_PERCENT = parseInt(item.parser_config?.PRICE_SELL_PERCENT || "10", 10);
            const PRICE_BUY_PERCENT = parseInt(item.parser_config?.PRICE_BUY_PERCENT || "10", 10);
            const PRICE_CHANGE_SENSITIVITY_PERCENT = parseFloat(item.parser_config?.PRICE_CHANGE_SENSITIVITY_PERCENT || "1");
            const DEPTH_CHANGE_SENSITIVITY_PERCENT = parseFloat(item.parser_config?.DEPTH_CHANGE_SENSITIVITY_PERCENT || "10");

            const FIRST_CURRENCY = item.parser_config?.FIRST_CURRENCY as string;
            const SECOND_CURRENCY = item.parser_config?.SECOND_CURRENCY as string;

            const PAIR_AGAINST_STABLECOIN = item.parser_config?.PAIR_AGAINST_STABLECOIN === "true";


            const PARSER_ENABLED = !!item.parser_config;
            const PARSER_TYPE = (item.parser_config?.PARSER_TYPE || "mexc") as ParserType;


            if (!allowedParserTypes.includes(PARSER_TYPE) && PARSER_ENABLED) {
                throw new Error(`PARSER_TYPE must be one of ${allowedParserTypes.join(", ")}`);
            }


            if (PARSER_ENABLED) {

                if (!FIRST_CURRENCY || !SECOND_CURRENCY) {
                    throw new Error("FIRST_CURRENCY and SECOND_CURRENCY must be specified in config if parser enabled");
                }


                const requiredNumbers = [
                    PRICE_INTERVAL_SEC,
                    PRICE_SELL_PERCENT,
                    PRICE_BUY_PERCENT,
                    PRICE_CHANGE_SENSITIVITY_PERCENT,
                    DEPTH_CHANGE_SENSITIVITY_PERCENT,
                ];

                if (requiredNumbers.some(e => isNaN(e))) {
                    throw new Error(
                        `One of the following config fields is not a number: 
                        PRICE_INTERVAL_SEC, 
                        PRICE_SELL_PERCENT, 
                        PRICE_BUY_PERCENT, 
                        PRICE_CHANGE_SENSITIVITY_PERCENT, 
                        DEPTH_CHANGE_SENSITIVITY_PERCENT
                        `
                    );
                }
            }

            return {
                pairId: parsedPairUrl,
                amount: parsedAmount,
                price: parsedPrice,
                type: parsedType,
                trade_id,
                parser_config: PARSER_ENABLED ? {
                    PARSER_TYPE: PARSER_TYPE,
                    PRICE_INTERVAL_SEC: PRICE_INTERVAL_SEC,
                    PRICE_SELL_PERCENT: PRICE_SELL_PERCENT,
                    PRICE_BUY_PERCENT: PRICE_BUY_PERCENT,
                    PRICE_CHANGE_SENSITIVITY_PERCENT: PRICE_CHANGE_SENSITIVITY_PERCENT,
                    DEPTH_CHANGE_SENSITIVITY_PERCENT: DEPTH_CHANGE_SENSITIVITY_PERCENT,
                    FIRST_CURRENCY: FIRST_CURRENCY,
                    SECOND_CURRENCY: SECOND_CURRENCY,
                    PAIR_AGAINST_STABLECOIN: PAIR_AGAINST_STABLECOIN,
                } : undefined,
            };
        });

        return preparedConfig;

    } catch (error) {
        console.error(error);
        throw new Error("config.json file is not found or invalid");
    }
})();

export const ACTIVITY_PING_INTERVAL = parseInt(process.env.ACTIVITY_PING_INTERVAL || "15", 10) * 1000;
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN as string | undefined;
export const TELEGRAM_ADMIN_USERNAME = process.env.TELEGRAM_ADMIN_USERNAME as string | undefined;

if (TELEGRAM_BOT_TOKEN && !TELEGRAM_ADMIN_USERNAME) {
    throw new Error("TELEGRAM_ADMIN_USERNAME must be specified in .env file when TELEGRAM_BOT_TOKEN is set");
}

if (TELEGRAM_ADMIN_USERNAME && !TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN must be specified in .env file when TELEGRAM_ADMIN_USERNAME is set");
}
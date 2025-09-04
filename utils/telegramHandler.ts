import * as env from "../env-vars";
import { Telegraf } from "telegraf";
import Settings from "../schemes/Settings";

class TelegramHandler {

    private bot: Telegraf;
    private adminUsername: string;

    constructor() {

        if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_USERNAME) {
            return;
        }

        this.bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
        this.adminUsername = env.TELEGRAM_ADMIN_USERNAME.replace('@', '');

        this.bot.on('message', async (ctx) => {

            if (ctx.message.from.username !== this.adminUsername) {
                return;
            }


            // @ts-ignore
            const text = ctx?.message?.text;


            if (text === '/activate_autobot') {

                const settings = (await Settings.findByPk(1))?.settings;
                if (!settings) {
                    throw new Error("Settings not found");
                }

                if (!ctx?.message?.chat?.id) {
                    await ctx.reply('Bot cannot be activated here');
                    return;
                }

                const chatId = String(ctx.message.chat.id);

                const newTgTargets = [...new Set([...(settings.telegram_targets || []), chatId])];


                await Settings.update({
                    settings: {
                        ...settings,
                        telegram_targets: newTgTargets
                    }
                }, { where: { id: 1 } });

                await ctx.reply('Autobot activated in this chat!');
                return;
            }

        });

    }

    async notify(text: string) {
        const chatIds = (await Settings.findByPk(1))?.settings.telegram_targets || [];
        console.log('Sending notification to Telegram. chats to notify:', chatIds);

        for (const chatId of chatIds) {
            try {
                await this.bot.telegram.sendMessage(chatId, text);
            } catch (error) {
                console.log(error);
            }
        }
    }

    async init() {
        await new Promise(r => this.bot.launch(() => r(true)));
        console.log("Telegram bot launched");
    }
}

const telegramHandler = new TelegramHandler();

export default telegramHandler;
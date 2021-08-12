import { botId } from "../../deps.ts"
import { bot } from "../bot.ts";
import { syncCommands } from "../util/commands/mod.ts";

bot.eventHandlers.ready = async () => {
    await syncCommands();
    await bot.cluster.init(botId);
    bot.logger.info("Ready!");
};
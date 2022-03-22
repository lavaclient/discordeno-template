import config from "../../config.ts";
import { createCommand } from "../util/commands/mod.ts";
import constants from "../util/constants.ts";

createCommand({
    name: "ping",
    description: "Displays the latency of the bot.",
    guildId: config.guild,
    execute: ctx => ctx.embed({ description: `Pong!`, color: constants.color })
});
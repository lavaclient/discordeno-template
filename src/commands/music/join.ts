import config from "../../../config.ts";
import { bot } from "../../bot.ts";
import { createCommand } from "../../util/commands/mod.ts";
import constants from "../../util/constants.ts";
import { getMemberVoiceState } from "../../util/helpers.ts";

createCommand({
    name: "join",
    description: "Joins your voice channel.",
    guildId: config.guild,
    execute: ctx => {
        if (!ctx.guildId) {
            return
        }

        const vc = getMemberVoiceState(ctx.guildId, ctx.userId)?.channelId
        if (!vc) {
            return ctx.embed({ description: "Join a voice channel bozo.", color: constants.color });
        }

        const player = bot.cluster.createPlayer(ctx.guildId);
        if (player.connected) {
            return ctx.embed({ description: "I'm already connected to a voice channel.", color: constants.color });
        }

        player.connect(vc);
        
        return ctx.embed({ description: `Joined <#${vc}>`, color: constants.color });
    }
});
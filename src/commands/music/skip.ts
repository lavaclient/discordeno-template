import config from "../../../config.ts";
import { bot } from "../../bot.ts";
import { getPlayerChannel } from "../../music/helpers.ts";
import { getQueue } from "../../music/songQueue.ts";
import { createCommand } from "../../util/commands/mod.ts";
import { getMemberVoiceState } from "../../util/helpers.ts";

createCommand({
    name: "skip",
    description: "Skips the current song",
    guildId: config.guild,
    defaultResponseVisibility: "ephemeral",
    execute: async ctx => {
        /* check if a player exists for this guild. */
        const player = bot.cluster.players.get(ctx.guildId!)
        if (!player?.connected) {
            return ctx.embed({ description: "There's no player for this guild... bozo." });
        }

        /* check if the user in the player's vc. */
        const vc = getMemberVoiceState(ctx.guildId!, ctx.userId)?.channelId;
        if (player && player.channelId !== vc) {
            return ctx.reply(`Join <#${player.channelId}> bozo`);
        }

        const queue = getQueue(player, ctx.channelId);

        /*  */
        if (!queue.current || queue.current.requester === ctx.userId) {
            await ctx.embed({ description: `<@${ctx.userId}> has skipped the current song.` }, { ephemeral: false })
            return queue.next();
        }
        

        if (queue.skips.has(ctx.userId)) {
            return ctx.embed({ description: "It looks like you've already voted to skip :thinking:" });
        }

        queue.skips.add(ctx.userId);

        const playerChannel = getPlayerChannel(player);
        const skipsNeeded = Math.floor(75 * (playerChannel.voiceStates?.size ?? 1) / 100);
        if (skipsNeeded > queue.skips.size) {
            return ctx.embed({ description: `Wow, you still need **${skipsNeeded - queue.skips.size}** votes to skip :pensive:` }, { ephemeral: false });
        }

        await ctx.embed({ description: `Reached enough votes to skip [**${queue.current.info.title}**](${queue.current.info.uri}).` }, { ephemeral: false });
        await queue.next();
    }
})
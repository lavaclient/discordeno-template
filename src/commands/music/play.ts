import { Track } from "https://deno.land/x/lavalink_types@2.0.6/mod.ts";
import { bot } from "../../bot.ts";
import { createCommand } from "../../util/commands/mod.ts";
import { getMemberVoiceState } from "../../util/helpers.ts";
import { getQueue } from "../../music/songQueue.ts";

createCommand({
    name: "play",
    description: "Plays a track.",
    defaultVisibility: "ephemeral",
    options: [
        {
            name: "query",
            description: "Song query",
            type: "String"
        },
        {
            name: "platform",
            description: "Where to search for tracks.",
            type: "String",
            choices: {
                SoundCloud: "scsearch:",
                YouTube: "ytsearch:",
            },
            default: "YouTube"
        }
    ],
    execute: async (ctx, { query, platform }: { query: string, platform: SearchPlatform }) => {
        /* check if the user is in a vc. */
        const vc = getMemberVoiceState(ctx.guildId!, ctx.userId)?.channelId;
        if (!vc) {
            return ctx.reply("Join a voice channel bozo");
        }

        /* check if a player exists for this guild. */
        let player = bot.cluster.players.get(ctx.guildId!);
        
        /* check if the user in the player's vc. */
        if (player && player.channelId !== vc) {
            return ctx.reply(`Join <#${player.channelId}> bozo`);
        }

        /* search. */
        const results = await bot.cluster.rest.loadTracks(/^https?:\/\//.test(query)
            ? query
            : `${platform}${query}`);

        let tracks: Track[] = [], msg: string = "";
        switch (results.loadType) {
            case "LOAD_FAILED":
            case "NO_MATCHES":
                return ctx.embed({ description: "uh oh something went wrong" });
            case "PLAYLIST_LOADED":
                tracks = results.tracks;
                msg = `Queued playlist [**${results.playlistInfo.name}**](${query}), it has a total of **${tracks.length}** tracks.`;
                break
            case "TRACK_LOADED":
            case "SEARCH_RESULT":
                const [track] = results.tracks;
                tracks = [track];
                msg = `Queued [**${track.info.title}**](${track.info.uri})`;
                break;
        }

        /* create and/or join the member's vc */
        if (!player?.connected) {
            player ??= bot.cluster.createPlayer(ctx.guildId!);
            player.connect(vc, { deafen: true });
        }

        const queue = getQueue(player, ctx.channelId!);

        /* reply with the queued message. */
        ctx.embed({ description: msg }, { ephemeral: !player.playing });

        /* do queue things.*/
        queue.add(ctx.userId, ...tracks);
        if (!player.playing && !player.paused) {
            await queue.start();
        }
    }

})

export type SearchPlatform = `${"yt" | "sc"}search:`;

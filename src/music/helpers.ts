import { cache, DiscordenoChannel, Player } from "../../deps.ts";

export function getPlayerChannel(player: Player): DiscordenoChannel {
    return cache.channels.get(player.channelId!)!;
}
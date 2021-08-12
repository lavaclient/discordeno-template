import { sendShardMessage } from "https://deno.land/x/discordeno@12.0.1/src/ws/send_shard_message.ts";
import { Cluster } from "https://deno.land/x/lavadeno@3.1.1/mod.ts";
import config from "../config.ts";
import { getLogger } from "./util/logger.ts";
import { cache, Collection, EventHandlers, ws } from "../deps.ts";

import type { Command } from "./util/commands/mod.ts";
import type { Queue } from "./music/songQueue.ts";

export const bot = {
    commands: new Collection<string, Command>(),
    eventHandlers: {} as EventHandlers,
    queues: new Collection<bigint, Queue>(),
    cluster: new Cluster({
        nodes: [ config.music ],
        sendGatewayPayload: (id, payload) => {
            const shard = cache.guilds.get(id)?.shardId;
            if (shard != null) sendShardMessage(shard, payload);
        }
    }),
    logger: getLogger("bot"),
    get averagePing() {
        return ws.shards
            .map(shard => shard.heartbeat.lastReceivedAt - shard.heartbeat.lastSentAt)
            .reduce((sum, ping) => sum + ping, 0) / ws.shards.size;
    }
}

import { DiscordVoiceServer, DiscordVoiceState, DiscordGatewayOpcodes, GatewayPayload, ws } from "../../deps.ts";
import { bot } from "../bot.ts";

bot.eventHandlers.raw = (payload: GatewayPayload) => {
    if (payload.op !== DiscordGatewayOpcodes.Dispatch) {
        return;
    }

    switch (payload.t) {
        case "VOICE_SERVER_UPDATE":
        case "VOICE_STATE_UPDATE":
            bot.cluster.handleVoiceUpdate(payload.d as DiscordVoiceServer | DiscordVoiceState);
            break;
    }
}

bot.eventHandlers.dispatchRequirements = (payload, shardId) => {
    const shard = ws.shards.get(shardId);
    if (!shard) {
        return;
    }

    switch (payload.op) {
        case DiscordGatewayOpcodes.HeartbeatACK:
            shard.heartbeat.lastReceivedAt = Date.now();
            break;
    }
}
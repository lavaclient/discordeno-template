import { deleteMessage, sendMessage } from "../../deps.ts";
import { bot } from "../bot.ts";
import constants from "../util/constants.ts";
import type { Queue } from "./songQueue.ts";

export interface QueueTimeout {
    id?: number;
    message?: bigint;
}

export function startQueueTimeout(queue: Queue) {
    sendMessage(queue.messenger.channel.id, {
        embeds: [
            {
                description: `Oh no, the queue has ended! I'll give you **${constants.playerTimeout / 1000} seconds**.`,
                color: constants.color
            }
        ]
    })
        .then(message => queue.timeout.message = message.id);

    queue.timeout.id = setTimeout(finishQueue.bind(null, queue), constants.playerTimeout)
}

export function finishQueue(queue: Queue) {
    clearQueueTimeout(queue);

    queue.messenger.tryDeleteLastUpdate();
    queue.eventHandlers?.finished?.();
    queue.player.disconnect();

    bot.cluster.destroyPlayer(queue.player.guildId)
    bot.queues.delete(queue.player.guildId);
}

export function clearQueueTimeout(queue: Queue) {
    if (queue.timeout.message) {
        try {
            deleteMessage(queue.messenger.channel.id, queue.timeout.message)
        } finally {
            delete queue.timeout.message;
        }
    }

    if (queue.timeout.id != null) {
        clearTimeout(queue.timeout.id);
        delete queue.timeout.id;
    }
}

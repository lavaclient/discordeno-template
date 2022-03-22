import { cache, deleteMessage, DiscordenoChannel, editMessage, Embed, sendMessage } from "../../deps.ts";

cache.channels.stopSweeper()

export interface QueueMessenger {
    /* getters */

    /**
     * The channel that this messenger sends messages to.
     */
    channel: DiscordenoChannel;

    /* methods */

    /**
     * If {@link lastTrackUpdate} is not null, or present within {@link channel} this method will call {@link editTrackUpdate}
     * otherwise {@link newTrackUpdate}
     *
     * @param embeds The embeds to send.
     */
    postTrackUpdate(...embeds: Embed[]): Promise<void>;

    /**
     * Attempts to delete {@link lastTrackUpdate}
     */
    tryDeleteLastUpdate(): Promise<void>;
}

export function getQueueMessenger(channelId: bigint): QueueMessenger {
    let lastTrackUpdate: bigint | null = null;

    async function sendTrackUpdate(embeds: Embed[]) {
        const message = await sendMessage(channelId, { embeds })    
        lastTrackUpdate = message.id;
    }

    async function tryDeleteLastUpdate() {
        if (!lastTrackUpdate) {
            return;
        }

        try { 
            await deleteMessage(channelId, lastTrackUpdate);
        } finally {
            lastTrackUpdate = null;
        }
    }

    async function editTrackUpdate(embeds: Embed[]) {
        if (!lastTrackUpdate) {
            return sendTrackUpdate(embeds);
        }

        try { 
            await editMessage(channelId, lastTrackUpdate, { embeds });
        } catch {
            await sendTrackUpdate(embeds);
        }
    }

    async function newTrackUpdate(embeds: Embed[]) {
        await tryDeleteLastUpdate()
        await sendTrackUpdate(embeds);
    }

    return {
        get channel() {
            return cache.channels.get(channelId)!;
        },
        async postTrackUpdate(...embeds) {
            try {
                switch (lastTrackUpdate) {
                    case null:
                        await newTrackUpdate(embeds);
                        break;
                    case this.channel.lastMessageId:
                        await editTrackUpdate(embeds);
                        break;
                    default:
                        await newTrackUpdate(embeds);
                }
            } catch {
                await newTrackUpdate(embeds)
            }
        },
        tryDeleteLastUpdate
    }
}
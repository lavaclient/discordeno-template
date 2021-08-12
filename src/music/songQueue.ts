import { mayStartNext, Track } from "https://deno.land/x/lavalink_types@2.0.6/mod.ts";
import { createNewProp } from "../../deps.ts";
import { bot } from "../bot.ts";
import constants from "../util/constants.ts";
import { sendEmbeds } from "../util/helpers.ts";
import { clearQueueTimeout, finishQueue, QueueTimeout, startQueueTimeout } from "./timeouts.ts";
import { getQueueMessenger, QueueMessenger } from "./messenger.ts";

import type { Player } from "https://deno.land/x/lavadeno@3.1.1/mod.ts";

export enum LoopType {
    Track,
    Queue
}

const baseQueue: Partial<Queue> = {
    start(this: Queue) {
        const next = this.nextUp.shift();
        if (!next) {
            return this!;
        }

        this.current = next;
        this.player.play(this.current);

        return this;
    },
    next(this: Queue, timeout = true) {
        const next = this.nextUp.shift();
        if (!next) {
            timeout
                ? startQueueTimeout(this)
                : finishQueue(this)

            return this;
        }

        this.current = next;
        this.player.play(this.current);
        return this;
    },
    add(this: Queue, requester: bigint, ...track: Track[]) {
        clearQueueTimeout(this);

        const tracks: QueueEntry[] = track.map(t => {
            Reflect.set(t, "requester", requester);
            return t;
        })

        this.nextUp.push(...tracks)
        return this;
    },
    get length() {
        return this.nextUp!.length;
    }
}


/* creation bull shit. */
function getQueueEventHandlers(queue: Queue): EventHandlers {
    return {
        finished: () => sendEmbeds(queue.messenger.channel.id, {
            description: `Okay, I left <#${queue.player.channelId}>`,
            color: constants.color
        }),
        trackStart: track => queue.messenger.postTrackUpdate( {
            description: `Now playing [**${track.info.title}**](${track.info.uri}) <@${track.requester}>`,
            color: constants.color
        })
    }
}

function coupleQueuePlayer(player: Player, queue: Queue) {
    player.on("trackEnd", async (_, reason) => {
        queue.skips.clear();
        if (!mayStartNext[reason]) {
            return;
        }

        queue.last = queue.current;
        switch (queue.loop.type) {
            case LoopType.Queue:
                queue.previous.push(queue.current!);
                break;
            case LoopType.Track:
                await player.play(queue.current!);
                break;
        }

        if (!queue.length) {
            queue.nextUp = queue.previous;
            queue.previous = [];
        }

        queue.next();
    });

    player.on("trackStart", () => {
        if (!queue.current) {
            return;
        }

        if (queue.current === queue.last && queue.loop.type) {
            queue.loop.count++;
        }

        queue.eventHandlers?.trackStart?.(queue.current!);
    });
}

export function getQueue(player: Player, channelId: bigint, eventHandlers?: EventHandlers) {
    const existing = bot.queues.get(player.guildId);
    if (existing) {
        return existing;
    }

    /* get props. */
    const props: Record<string, ReturnType<typeof createNewProp>> = {
        messenger: createNewProp(getQueueMessenger(channelId)),
        skips: createNewProp(new Set()),
        nextUp: createNewProp([]),
        previous: createNewProp([]),
        player: createNewProp(player),
        loop: createNewProp({ count: 0 }),
        timeout: createNewProp({})
    }

    const queue: Queue = Object.create(baseQueue, props);
    queue.eventHandlers = eventHandlers ?? getQueueEventHandlers(queue);

    /* attach listeners to the player. */
    coupleQueuePlayer(player,  queue)

    /* register the queue and return it. */
    bot.queues.set(player.guildId, queue);
    return queue;
}

export interface Queue {
    player: Player;
    eventHandlers: EventHandlers;
    timeout: QueueTimeout;
    messenger: QueueMessenger;

    /* state */
    skips: Set<bigint>;
    nextUp: QueueEntry[];
    previous: QueueEntry[];
    current?: QueueEntry;
    last?: QueueEntry;
    loop: QueueLoop;

    /* getters */
    length: number;

    /* methods */
    add(requester: bigint, ...tracks: Track[]): this;
    start(): this;
    next(timeout?: boolean): this;
}

export interface EventHandlers {
    finished?: () => void;
    trackStart?: (track: QueueEntry) => void;
    trackEnd?: (track: QueueEntry) => void;
}

export interface QueueEntry extends Track {
    requester?: bigint;
}

export interface QueueLoop {
    type?: LoopType;
    count: number;
}

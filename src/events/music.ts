import { bot } from "../bot.ts";
import { getLogger } from "../util/logger.ts";

const logger = getLogger("music");
bot.cluster.on("nodeDisconnect", (node, code, reason) => logger.warn(`node "${node.id}" has been disconnected, code=${code}, reason=${reason ?? "unknown"}.`));
bot.cluster.on("nodeConnect", (node, took, reconnected) => logger.info(`node "${node.id}" ${reconnected ? "has reconnected." : `is now connected, took ${took}ms`}`));
bot.cluster.on("nodeError", (node, error) => logger.error(`node "${node.id}" has ran into an error.`, error));
bot.cluster.on("nodeDebug", (_, debug) => logger.debug(debug))
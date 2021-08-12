import config from "./config.ts";
import { startBot } from "./deps.ts";
import { bot } from "./src/bot.ts";
import { fileLoader, importDirectory } from "./src/util/helpers.ts";

await Promise.all(["./src/commands", "./src/events",].map((path) => importDirectory(Deno.realPathSync(path))));
await fileLoader();

startBot({
    token: config.token,
    intents: config.intents,
    eventHandlers: bot.eventHandlers
});

import constants from "../util/constants.ts";
import { hide } from "../util/commands/helpers.ts";
import { createCommand } from "../util/commands/mod.ts";

createCommand({
    name: "eval",
    description: "Evaluates code.",
    guildId: 830616783199010857n,
    ownerOnly: true,
    options: [
        {
            name: "code",
            description: "Code to evaluate",
            type: "String"
        },
        {
            name: "async",
            description: "Whether this is an asyncronous script",
            type: "Boolean",
            default: false,
        },
        {
            name: "silent",
            description: "Whether to send a response",
            type: "Boolean",
            default: false,
        },
        {
            name: "depth",
            description: "Result inspection depth.",
            type: "Integer",
            default: 1
        },
        hide
    ],
    execute: async (ctx, { code, async, hide, silent, depth }: args) => {
        ctx.defaultVisibility = hide ? "ephemeral" : "public";

        let toExec = code;
        if (async && code.includes("await")) {
            toExec = `(async () => { return ${code}; })();`
        }

        const start = performance.now()

        let result, timeSync, timeAsync, type;
        try {
            result = eval(toExec);

            /* sync time */
            timeSync = performance.now() - start;

            /* check for a promise. */
            if (result instanceof Promise) {
                result = await result;
                timeAsync = performance.now() - start;
            }

            type = typeof result;
        } catch (e) {
            return ctx.embed({
                title: `The script has failed.`,
                fields: [
                    {
                        name: "Error",
                        value: `\`\`\`js\n${e}\n\`\`\``
                    }
                ],
            });
        }

        const format = (time: number) => time < 1
            ? `${(time * 1000).toFixed(2)}μs`
            : time >= 1000
                ? `${(time / 1000).toFixed(2)}s`
                : `${time.toFixed(2)}ms`;

        /* check if result is not a string. */
        if (typeof result !== "string") {
            result = Deno.inspect(result, { depth, showHidden: true, compact: false })
        }

        /* check if the result is too large. */
        if (result.length > 2035) {
            result = result.slice(2035) + "\n...";
        }

        /* replace any mentions and/or tokens */
        result = result
            .replace(/[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g, "--REDACTED--")
            .replace(/`/g, `\`${String.fromCharCode(8203)}`)
            .replace(/@/g, `@${String.fromCharCode(8203)}`);

        if (silent) {
            return;
        }

        return ctx.embed({
            description: `\`\`\`ts\n${result}\n\`\`\``,
            color: constants.color,
            title: "Script has finished.",
            fields: [
                {
                    name: "Script",
                    value: `\`\`\`js\n${code.length > 1012 ? code.slice(1012) + "\n..." : code}\n\`\`\``
                },
                {
                    name: "\u200b",
                    value: [
                        `⏱ ${timeAsync ? `${format(timeAsync)}<${format(timeSync)}>` : format(timeSync)}`,
                        `🏷️ \`${type}\``
                    ].join("\n")
                }
            ]
        });
    }
});

type args = {
    code: string;
    async: boolean;
    hide: boolean;
    silent: boolean;
    depth: number;
}

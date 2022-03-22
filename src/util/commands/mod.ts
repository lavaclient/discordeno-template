import { batchEditSlashCommandPermissions, Collection, createNewProp, createSlashCommand, deleteSlashCommand, getSlashCommands, InteractionResponseTypes, sendInteractionResponse, SlashCommandInteraction, snowflakeToBigint } from "../../../deps.ts";
import { bot } from "../../bot.ts";
import constants from "../constants.ts";
import { getLogger } from "../logger.ts";
import { CommandContext, CommandOptions, CommandPermission, Embed, ReplyOptions, ResponseVisibility } from "./base.ts";
import { toDiscordCommand, toDiscordCommandPermission } from "./creation.ts";

export * from "./base.ts"
export * from "./creation.ts";

const logger = getLogger("commands");
const baseCommandContext: Partial<CommandContext> = {
    get bot() {
        return bot;
    },
    get message() {
        return this.interaction?.message;
    },
    get member() {
        return this.interaction?.member;
    },
    get user() {
        return (this.interaction?.user ?? this.member?.user)!;
    },
    get userId() {
        return snowflakeToBigint(this.user!.id)
    },
    get guildId() {
        return this.interaction?.guildId
            ? snowflakeToBigint(this.interaction?.guildId)
            : undefined;
    },
    get channelId() {
        return snowflakeToBigint(this.interaction?.channelId!)
    },
    embed(data: Embed, options?: ReplyOptions) {
        data.color ??= constants.color;

        return this.reply!({ embeds: [data], ...options });
    },
    reply(arg0: ReplyOptions | string, arg1: Partial<ReplyOptions> = {}) {
        let options: Partial<ReplyOptions> = arg1;
        if (typeof arg0 === "string") {
            options.content = arg0;
        } else {
            options = arg0;
        }

        const data = {
            type: options.type ?? this.defaultResponseType ?? InteractionResponseTypes.ChannelMessageWithSource,
            data: options,
            private: options.ephemeral ?? this.defaultVisibility === "ephemeral"
        }

        return sendInteractionResponse(this.interaction?.id!, this.interaction?.token!, data);
    }
}

export async function syncCommands() {
    const start = Date.now();
    logger.debug("syncing slash commands, this may take a while.");

    /* global slash commands. */
    await syncCommandsFor();

    /* guild slash commands. */
    const guilds = bot.commands
        .filter(c => !!c.guildId)
        .reduce((guilds, command) => guilds.add(command.guildId!), new Set<bigint>())

    for (const guild of guilds) {
        await syncCommandsFor(guild);
    }

    logger.info(`synced slash commands, took ${Date.now() - start}ms`);
}

export async function syncCommandsFor(guildId?: bigint) {
    const prefix = `slash commands (${guildId ?? "global"})`;

    /* get the commands that have been loaded. */
    const commands = bot.commands.filter(command => command.guildId === guildId);

    /* get the commands that are currently registered. */
    const registered = await getSlashCommands(guildId);

    if (Deno.args.includes("--no-sync")) {
        let found = 0;
        for (const [name, command] of commands) {
            const ref = registered.get(name);
            if (!ref) {
                continue;
            }

            command.ref = ref;
            found++;
        }

        logger.debug(`${prefix} found ${found}/${commands.size}`);
        return;
    }

    /* find the commands that need to be deleted, updated, or created. */
    const toCreate = commands.filter(c => registered.every(r => r.name !== c.name))
        , toDelete = registered.filter(r => commands.every(c => r.name !== c.name))
        , toUpdate = commands.filter(c => registered.some(r => r.name === c.name));

    logger.debug(`${prefix} to create=${toCreate.size}, update=${toUpdate.size}, delete=${toDelete.size}`);

    /* delete any slash commands. */
    for (const [name, command] of toDelete) {
        const guildId = command.guildId
            ? snowflakeToBigint(command.guildId)
            : undefined;

        await deleteSlashCommand(command.id, guildId);
        logger.debug(`${prefix} deleted slash command "${name}"`);
    }

    /* create slash commands. */
    const creating = new Collection([...toCreate.entries(), ...toUpdate.entries()])
    for (const [, command] of creating) {
        const ref = await createSlashCommand(toDiscordCommand(command), command.guildId)
        logger.debug(`${prefix} created/updated command "${command.name}"`)
        command.ref = { ...ref, id: snowflakeToBigint(ref.id), applicationId: snowflakeToBigint(ref.applicationId) };
    }

    /* update command permissions. */
    if (guildId) {
        const commandsWithPermissions = creating
            .filter(c => (c.permissions?.length ?? 0) > 0)

        const creatingPermissionsFor = commandsWithPermissions
            .map(c => ({ id: c.ref!.id.toString(), permissions: c.permissions!.map(toDiscordCommandPermission) }));

        const str = commandsWithPermissions
            .map(c => c.permissions!
                .map(p => `${p.allow ? "" : "dis"}allowed ${p.type.toLowerCase()} ${p.id}`)
                .join(", "))
            .join("; ")

        logger.debug(`${prefix} creating permissions: ${str}`)

        await batchEditSlashCommandPermissions(guildId, creatingPermissionsFor);
    }
}

export function createCommand(options: CommandOptions) {
    if (!options.execute && !options.subCommands?.length) {
        throw new Error(`Command "${options.name}" must have an executor or at-least one sub command.`);
    }

    if (options.ownerOnly && options.guildId) {
        options.permissions ??= [];
        options.permissions.push({ id: options.guildId, type: "Role", allow: false });
        options.permissions.push(...constants.owners.map<CommandPermission>(id => ({ id, type: "User", allow: true })));
    }

    bot.commands.set(options.name, options);
}

export function getCommandContext(interaction: SlashCommandInteraction, defaultVisibility: ResponseVisibility = "public", defaultResponseType: InteractionResponseTypes = InteractionResponseTypes.ChannelMessageWithSource): CommandContext {
    const props: Record<string, ReturnType<typeof createNewProp>> = {}
    props.interaction = createNewProp(interaction);
    props.defaultVisibility = createNewProp(defaultVisibility);
    props.defaultResponseType = createNewProp(defaultResponseType);

    return Object.create(baseCommandContext, props) as CommandContext;
}



import { ApplicationCommandOption, ApplicationCommandOptionChoice, ApplicationCommandOptionTypes, ApplicationCommandPermissionTypes, DiscordenoChannel, DiscordenoRole, Embed as IEmbed, InteractionApplicationCommandCallbackData, InteractionGuildMember, InteractionResponseTypes, Message, SlashCommandInteraction, User } from "../../../deps.ts";
import { Bot } from "../../bot.ts";

type CommandOptionTypes = {
    "String": string,
    "Number": number,
    "Integer": number,
    "User": User,
    "Channel": DiscordenoChannel,
    "SubCommand": null,
    "SubCommandGroup": null,
    "Boolean": boolean,
    "Role": DiscordenoRole,
    "Mentionable": DiscordenoRole | User;
}

export type CommandExecutor = (ctx: CommandContext, options: any) => void;
export type CommandOptions = Omit<Command, "ref"> & { ownerOnly?: boolean; };
export type CommandOptionType = keyof typeof ApplicationCommandOptionTypes;
export type CommandOptionChoices = ApplicationCommandOptionChoice[] | Record<string, string | number>;
export type Embed = Omit<IEmbed, "type">;
export type ResponseVisibility = "ephemeral" | "public";

interface Base {
    name: string;
    description: string;
}

interface BaseCommand extends Base {
    options?: CommandOption[];
    execute: CommandExecutor;
    defaultResponseVisibility?: ResponseVisibility;
    defaultResponseType?: InteractionResponseTypes;
}

export interface Command extends BaseCommand {
    ref?: CommandRef;
    guildId?: bigint;
    subCommands?: (SubCommand | SubCommandGroup)[];
    permissions?: CommandPermission[];
}

export interface CommandPermission {
    id: bigint;
    type: keyof typeof ApplicationCommandPermissionTypes;
    allow: boolean;
}

export type SubCommand = BaseCommand;

export interface SubCommandGroup extends Base {
    commands: SubCommand[];
}

export interface CommandOption extends Base {
    type: CommandOptionType;
    required?: boolean;
    choices?: CommandOptionChoices;
    default?: unknown;
}

export interface CommandContext {
    /* defaults */
    defaultResponseType: InteractionResponseTypes;
    defaultVisibility: ResponseVisibility;

    /* actual data. */
    interaction: SlashCommandInteraction;

    /* getters */
    bot: Bot;
    message?: Message;
    member?: InteractionGuildMember;
    user: User;
    userId: bigint;
    guildId?: bigint;
    channelId: bigint;

    /* methods */
    embed(data: Embed, options?: ReplyOptions): Promise<void>;
    reply(content: string, options?: Omit<Partial<ReplyOptions>, "content">): Promise<void>;
    reply(options: ReplyOptions): Promise<void>;
}

export interface ReplyOptions extends InteractionApplicationCommandCallbackData {
    type?: InteractionResponseTypes;
    ephemeral?: boolean;
}

export interface CommandRef {
    id: bigint;
    applicationId: bigint;
    guildId?: string;
    name: string;
    description?: string;
    options?: ApplicationCommandOption[];
    defaultPermission?: boolean;
}

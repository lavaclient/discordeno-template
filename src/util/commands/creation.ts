import { ApplicationCommandOption, ApplicationCommandOptionChoice, ApplicationCommandOptionTypes, ApplicationCommandPermissions, ApplicationCommandPermissionTypes, CreateGlobalApplicationCommand, CreateGuildApplicationCommand } from "../../../deps.ts";
import { Command, CommandOptionChoices, CommandPermission, SubCommand, SubCommandGroup } from "./base.ts";

/* root commands */
export function toDiscordCommand(command: Command): CreateGlobalApplicationCommand | CreateGuildApplicationCommand {
    return {
        name: command.name,
        description: command.description,
        options: command.subCommands?.length ? toDiscordSubCommands(command) : toDiscordCommandOptions(command),
    }
}

/* permissions */
export function toDiscordCommandPermission(permission: CommandPermission): ApplicationCommandPermissions {
    return {
        id: permission.id.toString(),
        type: ApplicationCommandPermissionTypes[permission.type],
        permission: permission.allow
    }
}

/* sub commands */
export function toDiscordSubCommands(command: Command | SubCommandGroup): ApplicationCommandOption[] {
    return "commands" in command
        ? [ toDiscordSubCommandGroup(command) ]
        : command.subCommands?.map(sub => "commands" in sub ? toDiscordSubCommands(sub)[0] : toDiscordSubCommand(sub)) ?? [];
}

export function toDiscordSubCommand(command: SubCommand): ApplicationCommandOption {
    return {
        type: ApplicationCommandOptionTypes.SubCommand,
        name: command.name,
        description: command.description,
        options: toDiscordCommandOptions(command)
    }
}

export function toDiscordSubCommandGroup(group: SubCommandGroup): ApplicationCommandOption {
    return {
        type: ApplicationCommandOptionTypes.SubCommandGroup,
        name: group.name,
        description: group.description,
        options: group.commands.map(toDiscordSubCommand)
    }
}

/* options */
export function toDiscordCommandOptions(command: Command | SubCommand): ApplicationCommandOption[] {
    const options: ApplicationCommandOption[] = [];
    for (const option of command?.options ?? []) {
        if (["SubCommand", "SubCommandGroup"].includes(option.type)) {
            throw new Error("Slash-command sub-commands must be passed in the 'subCommands' field.");
        }

        options.push({
            type: ApplicationCommandOptionTypes[option.type],
            description: option.description,
            name: option.name,
            required: option.required ?? option.default == null,
            choices: option.choices && toDiscordCommandOptionChoices(option.choices)
        });
    }

    return options;
}

export function toDiscordCommandOptionChoices(choices: CommandOptionChoices): ApplicationCommandOptionChoice[] {
    return Array.isArray(choices)
        ? choices
        : Object.entries(choices).map(([name, value]) => ({ name, value }));
}

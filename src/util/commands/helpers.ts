import { Command, CommandOption, CommandOptionChoices, SubCommand, SubCommandGroup } from "./base.ts";

export const hide: CommandOption = {
    name: "hide",
    description: "Whether to send a public response.",
    type: "Boolean",
    default: false
}

export function getSubCommandGroup(command: Command, name: string): SubCommandGroup {
    const group = command.subCommands?.find(sc => "commands" in sc && sc.name === name) as SubCommandGroup | undefined
    if (!group) {
        throw new Error(`Command ${command.name} has no sub-command group named "${name}"`);
    }

    return group;
}

export function getSubCommand(command: Command | SubCommandGroup, name: string): SubCommand {
    const _command = "commands" in command
        ? command.commands.find(sc => sc.name === name)
        : command.subCommands?.find(sc => !("commands" in sc) && sc.name === name) as SubCommand | undefined;

    if (!_command) {
        throw new Error(`${"commands" in command ? `Sub-command group "${command.name}"` : `Command ${command.name}`} has no sub-command named "${name}"`);
    }

    return _command;
}

export function getOptionChoice(choices: CommandOptionChoices, name: string): string | number {
    const value = Array.isArray(choices)
        ? choices.find(c => c.name === name)?.value
        : choices[name];

    if (!value) {
        throw new Error(`Unknown choice "${name}"`);
    }

    return value;
}

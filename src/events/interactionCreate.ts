import { ApplicationCommandInteractionDataOptionWithValue, ApplicationCommandOptionTypes as OptionType, DiscordInteractionTypes, SlashCommandInteraction, snowflakeToBigint } from "../../deps.ts";
import { bot } from "../bot.ts";
import { getOptionChoice, getSubCommand, getSubCommandGroup } from "../util/commands/helpers.ts";
import { Command, getCommandContext, SubCommand, SubCommandGroup } from "../util/commands/mod.ts";

bot.eventHandlers.interactionCreate = (_interaction) => {
    if (_interaction.type === DiscordInteractionTypes.ApplicationCommand) {
        const interaction = _interaction as SlashCommandInteraction;

        /* the options for this command. */
        let options: ApplicationCommandInteractionDataOptionWithValue[] = [];

        /* find the command to call. */
        const rootCommandId = snowflakeToBigint(interaction.data!.id);

        /*  */
        const rootCommand = bot.commands.find(c => c.ref?.id === rootCommandId);
        if (!rootCommand) {
            return;
        }

        /* find the command to call. */
        let command: Command | SubCommand = rootCommand;

        const groupOrCommand = (interaction.data?.options ?? [])[0]
        if (groupOrCommand && [OptionType.SubCommand, OptionType.SubCommandGroup].includes(groupOrCommand.type)) {
            let name: string, commands: Command | SubCommandGroup;
            switch (groupOrCommand.type) {
                case OptionType.SubCommand:
                    name = groupOrCommand.name;
                    commands = rootCommand;
                    options = groupOrCommand.options ?? [];
                    break;
                case OptionType.SubCommandGroup:
                    commands = getSubCommandGroup(rootCommand, groupOrCommand.name);
                    name = groupOrCommand.options![0].name;
                    options = groupOrCommand.options![0].options ?? [];
                    break;
            }

            command = getSubCommand(commands!, name!);
        } else {
            options = (interaction.data?.options ?? []) as ApplicationCommandInteractionDataOptionWithValue[];
        }

        /* call the command. */
        const optionsDict: Record<string, unknown> = {}
        for (const option of command.options ?? []) {
            const value = options.find(o => o.name === option.name)?.value;
            const defaultValue = option.default != null
                ? option.choices ? getOptionChoice(option.choices, `${option.default}`) : option.default
                : undefined

            optionsDict[option.name] = value ?? defaultValue;
        }

        command.execute?.(getCommandContext(interaction, command.defaultVisibility, command.defaultResponseType), optionsDict);
    }
}
/** @format */
//#region               External Libs
import { Ok } from "ts-results";
import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Guild,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
//#endregion
//#region               Modules
import {
    BotErr,
    ErrorKind,
    ErrorOrigin,
    Result,
} from "@/system/handlers/errHandlers";
import { types as commandTypes } from "@/system/handlers/command";
//#endregion
//#region               Typing
export namespace types {
    export type data = () => Promise<Ok<commandTypes.CommandData>>;
    export type action = (
        configEntry: string,
        guildId: Guild
    ) => Promise<Result<void>>;
    export type execute = (
        interaction: ChatInputCommandInteraction
    ) => Promise<Result<void>>;
    export type autocomplete = (
        interaction: AutocompleteInteraction
    ) => Promise<Ok<void>>;
}
//#endregion
//#region           Variables
const commandName = "config";
export enum ConfigEntries {
    commandAllowedRoles = "command-allowed-roles",
}

//#endregion
//#region               Implementation
export const data: types.data = async () => {
    const description = {
        comm: "Altere as configurações de algo!",
        configEntry: "Qual é o nome da entrada que você quer modificar?",
        ephemeral: "Deseja que eu esconda essa mensagem?",
    };

    return new Ok({
        properties: {
            guild: false,
        },
        slashData: new SlashCommandBuilder()
            .setName(commandName)
            .setDescription(description.comm)
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
            .addNumberOption((configEntry) =>
                configEntry
                    .setName("config-entry")
                    .setDescription(description.configEntry)
                    .setRequired(true)
            )
            .addBooleanOption((ephemeral) =>
                ephemeral
                    .setName("ephemeral")
                    .setDescription(description.ephemeral)
                    .setRequired(false)
            ),
    });
};
export const action: types.action = async (configEntry, guild) => {
    switch (configEntry) {
        case ConfigEntries.commandAllowedRoles:
            break;
    }

    return Ok.EMPTY;
};
export const execute: types.execute = async (interaction) => {
    if (interaction.guild === null)
        return new BotErr({
            message:
                "Você está tentando acessar isso de fora de um servidor?" +
                "Essa função não é suportada ainda!",
            kind: ErrorKind.NotFound,
            origin: ErrorOrigin.Unknown,
        });

    const configEntry = interaction.options.getString("config-entry", true);
    const getEphemeral = interaction.options.getBoolean("ephemeral");
    await interaction.deferReply({
        ephemeral: getEphemeral !== null ? getEphemeral : true,
    });

    const result = (await action(configEntry, interaction.guild)).unwrap();

    //await interaction.editReply({ embeds: [result.data] });

    return Ok.EMPTY;
};
export const autocomplete: types.autocomplete = async (interaction) => {
    const focused = interaction.options.getFocused(true);

    if (focused.name === "config-entry") {
        await interaction.respond(
            Object.values(ConfigEntries).map((value) => ({
                value,
                name: value,
            }))
        );
    }

    return Ok.EMPTY;
};
//#endregion

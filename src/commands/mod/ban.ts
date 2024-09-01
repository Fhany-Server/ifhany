/** @format */
//#region               External Libs
import { Ok } from "ts-results";
import {
    ChatInputCommandInteraction,
    Guild,
    PermissionFlagsBits,
    SlashCommandBuilder,
    User,
} from "discord.js";
//#endregion
//#region               Modules
import { types as commandTypes } from "@/system/handlers/command";
import {
    BotErr,
    ErrorKind,
    ErrorOrigin,
    Result,
} from "@/system/handlers/errHandlers";
//#endregion
//#region               Typing
export namespace types {
    export type data = () => Promise<Ok<commandTypes.CommandData>>;
    export type action = (guild: Guild, user: User, reason: string) => Promise<Ok<void>>;
    export type execute = (
        interaction: ChatInputCommandInteraction
    ) => Promise<Ok<void>>;
}
//#endregion
//#region           Variables
const commandName = "ban";
//#endregion
//#region               Implementation
export const data: types.data = async () => {
    const description = {
        comm: "Aplique ban em alguém!",
        user: "Quem deseja banir?",
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
            .addUserOption((user) =>
                user
                    .setName("user")
                    .setDescription(description.user)
                    .setRequired(true)
            )
            .addBooleanOption((option) =>
                option
                    .setName("ephemeral")
                    .setDescription(description.ephemeral)
                    .setRequired(false)
            )
            .setDMPermission(false),
    });
};
export const action: types.action = async (guild, user, reason) => {
    await guild.members.ban(user, {
        reason,
    });

    return Ok.EMPTY;
};
export const execute: types.execute = async (interaction) => {
    const userToBan = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    const getEphemeral = interaction.options.getBoolean("ephemeral");
    await interaction.deferReply({
        ephemeral: getEphemeral !== null ? getEphemeral : true,
    });

    if (!interaction.guild)
        return new BotErr({
            message: "Guild not found!",
            kind: ErrorKind.NotFound,
            origin: ErrorOrigin.Unknown,
        });

    await action(interaction.guild, userToBan, reason);

    await interaction.editReply({ content: "O usuário foi punido!" });

    return Ok.EMPTY;
};
//#endregion
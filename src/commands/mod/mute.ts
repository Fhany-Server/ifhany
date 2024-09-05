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
import parse from "@/system/factories/parse.f";
import { types as commandTypes } from "@/system/handlers/command";
import {
    BotErr,
    ErrorKind,
    ErrorOrigin,
    Result,
} from "@/system/handlers/errHandlers";
import { PunishmentHandler } from "@/system/handlers/punishmentHandler";
//#endregion
//#region               Typing
export namespace types {
    export type data = () => Promise<Ok<commandTypes.CommandData>>;
    export type action = (
        guild: Guild,
        user: User,
        moderator: User,
        createdAt: Date,
        limit: string,
        reason: string
    ) => Promise<Ok<void>>;
    export type execute = (
        interaction: ChatInputCommandInteraction
    ) => Promise<Result<void>>;
}
//#endregion
//#region           Variables
const commandName = "mute";
//#endregion
//#region               Implementation
export const data: types.data = async () => {
    const description = {
        comm: "Aplique mute em alguém!",
        user: "Quem deseja mutar?",
        reason: "Qual o motivo do mute?",
        limit: "Por quanto tempo voce deseja manter essa pessoa mutada?",
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
            .addStringOption((reason) =>
                reason
                    .setName("reason")
                    .setDescription(description.reason)
                    .setRequired(true)
            )
            .addStringOption((limit) =>
                limit
                    .setName("limit")
                    .setDescription(description.limit)
                    .setRequired(true)
            )
            .addBooleanOption((ephemeral) =>
                ephemeral
                    .setName("ephemeral")
                    .setDescription(description.ephemeral)
                    .setRequired(false)
            )
            .setDMPermission(false),
    });
};
export const action: types.action = async (
    guild,
    user,
    moderator,
    createdAt,
    limit,
    reason
) => {
    const member = guild.members.resolve(user.id);

    if (!member)
        throw new BotErr({
            message: "Não consegui achar esse usuário!",
            kind: ErrorKind.NotFound,
            origin: ErrorOrigin.Unknown,
        });

    const parsedLimit = parse.limitToMili(limit).unwrap();

    await member.timeout(parsedLimit, reason);

    await new PunishmentHandler(guild).add(
        user.id,
        moderator.id,
        commandName,
        reason,
        createdAt,
        new Date(createdAt.getTime() + parsedLimit)
    );

    return Ok.EMPTY;
};
export const execute: types.execute = async (interaction) => {
    const userToMute = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const limit = interaction.options.getString("limit", true);

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

    await action(
        interaction.guild,
        userToMute,
        interaction.user,
        interaction.createdAt,
        limit,
        reason
    );

    await interaction.editReply({ content: "O usuário foi punido!" });

    return Ok.EMPTY;
};
//#endregion

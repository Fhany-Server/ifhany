/** @format */
//#region               External Libs
import { Ok } from "ts-results";
import {
    APIEmbed,
    ChatInputCommandInteraction,
    Guild,
    PermissionFlagsBits,
    SlashCommandBuilder,
    User,
} from "discord.js";
//#endregion
//#region               Modules
import {
    EmbedMessagesHandler,
    types as embedTypes,
} from "@/external/handlers/embed";
import { PunishmentHandler } from "@/system/handlers/punishmentHandler";
import {
    BotErr,
    ErrorKind,
    ErrorOrigin,
    Result,
} from "@/system/handlers/errHandlers";
import { types as commandTypes } from "@/system/handlers/command";
import { LOCALE } from "../..";
//#endregion
//#region               Typing
export namespace types {
    export type data = () => Promise<Ok<commandTypes.CommandData>>;
    export type action = (
        caseNumber: number,
        guildId: Guild
    ) => Promise<Result<embedTypes.CompleteEmbed>>;
    export type execute = (
        interaction: ChatInputCommandInteraction
    ) => Promise<Result<void>>;
    export type SubCommands = {
        list: (
            guild: Guild,
            user: User,
            pageNumber: number
        ) => Promise<Result<APIEmbed>>;
    };
}
//#endregion
//#region           Variables
const commandName = "punishment";
//#endregion
//#region               Implementation
export const data: types.data = async () => {
    const description = {
        comm: "Gerencie os casos de um usuário!",
        subCommands: {
            list: {
                comm: "Liste os casos de um usuário!",
                page: "Qual página você deseja ver?",
                user: "Você deseja ver os logs de qual usuário?",
            },
        },
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
            .addSubcommand((list) =>
                list
                    .setName("list")
                    .setDescription(description.subCommands.list.comm)
                    .addUserOption((user) =>
                        user
                            .setName("user")
                            .setDescription(description.subCommands.list.user)
                            .setRequired(true)
                    )
                    .addNumberOption((page) =>
                        page
                            .setName("page-number")
                            .setRequired(false)
                            .setDescription(description.subCommands.list.page)
                    )
                    .addBooleanOption((ephemeral) =>
                        ephemeral
                            .setName("ephemeral")
                            .setDescription(description.ephemeral)
                            .setRequired(false)
                    )
            )

            .setDMPermission(false),
    });
};

const subCommands: Factory<types.SubCommands> = () => {
    const factory: FactoryObj<types.SubCommands> = {
        list: async (guild, user, pageNumber) => {
            const casesPerPage = 5;
            const punishments = (
                await new PunishmentHandler(guild).getUserPunishments(user)
            ).unwrap();
            const totalPages = Math.ceil(punishments.length / casesPerPage);

            const embed = (
                await new EmbedMessagesHandler("info.punishmentList").Mount({
                    username: user.username,
                    currentPage: totalPages > 0 ? pageNumber : 0,
                    totalPages,
                    createdAtString: new Date().toLocaleString(LOCALE),
                    authorAvatar: user.displayAvatarURL(),
                    totalCases: punishments.length,
                })
            ).unwrap();

            embed.embedData.description = "";

            if (totalPages === 0) {
                embed.embedData.description =
                    "**Nenhum caso foi encontrado!** \n\n" +
                    "*Esse usuário só não está mais limpo que meu código... ks*";
            } else {
                for (let i = 0; i <= punishments.length - 1; i++) {
                    const punishment = punishments[i];

                    embed.embedData.description +=
                        `### Caso ${punishment.case} - ` +
                        `(${punishment.createdAt.toLocaleString(LOCALE)})\n`;
                    embed.embedData.description += `**Tipo**: \`${punishment.type}\`\n`;
                    embed.embedData.description +=
                        `**Usuário**: <@${punishment.userId}> ` +
                        `(${punishment.userId})\n`;
                    embed.embedData.description +=
                        `**Moderador**: <@${punishment.moderatorId}> ` +
                        `(${punishment.moderatorId})\n`;
                    embed.embedData.description += `**Motivo**: ${punishment.reason}\n`;

                    if (punishment.expiresAt !== punishment.createdAt) {
                        embed.embedData.description +=
                            `**Data Limite**: ` +
                            `${punishment.expiresAt.toLocaleString(LOCALE)}\n`;
                    }
                }
            }

            return Ok(embed.embedData);
        },
    };

    return factory;
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

    const scomms = subCommands();
    const subcommand = interaction.options.getSubcommand(true);
    const user = interaction.options.getUser("user", true);

    const getEphemeral = interaction.options.getBoolean("ephemeral");

    await interaction.deferReply({
        ephemeral: getEphemeral !== null ? getEphemeral : true,
    });

    let result;
    switch (subcommand) {
        case "list": {
            const getPageNumber = interaction.options.getNumber(
                "page-number",
                false
            );
            const pageNumber = getPageNumber !== null ? getPageNumber : 1;

            result = (
                await scomms.list(interaction.guild, user, pageNumber)
            ).unwrap();

            break;
        }
        default:
            throw new BotErr({
                message: "Nenhum subcomando foi atingido!",
                origin: ErrorOrigin.Internal,
                kind: ErrorKind.LogicError,
            });
    }

    await interaction.editReply({ embeds: [result] });

    return Ok.EMPTY;
};
//#endregion

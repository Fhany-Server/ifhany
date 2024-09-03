/** @format */
//#region           External Libs
import { Ok } from "ts-results";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    Events,
    GuildEmoji,
    MessageReaction,
    SlashCommandBuilder,
    Snowflake,
    TextBasedChannel,
    User,
} from "discord.js";
//#endregion
//#region           Modules
import react from "@/external/factories/react.f";
import filter from "@/system/factories/filter.f";
import verify from "@/system/factories/verify.f";
import {
    BotErr,
    DefaultErr,
    ErrorKind,
    ErrorOrigin,
    errors,
} from "@/system/handlers/errHandlers";
import { client, prisma } from "//index";
import { ListenerHandler } from "@/system/handlers/listener";
//#endregion
//#region           Typing
import { types as reactTypes } from "@/external/factories/react.f";
import { PresetDialogHandler } from "@/system/handlers/presetDialogManager";
import { types as commandTypes } from "@/system/handlers/command";
import { EmbedMessagesHandler } from "//lib/external/handlers/embed";
export namespace types {
    export type data = () => Promise<Ok<commandTypes.CommandData>>;

    export type ReceivedStoredParams = {
        name: string;
        chatID: string;
        emoji: string;
        emojiID?: string;
        customEmoji?: boolean;
    };
    export type GetEmojiResponse = {
        emoji: Snowflake;
        emojiID?: Snowflake;
    };

    export type actionFunction = (
        params: types.ReceivedStoredParams
    ) => Promise<Ok<AnyFunction>>;
    export type subActions = {
        add: (
            interaction: ButtonInteraction,
            handler: PresetDialogHandler
        ) => Promise<Ok<void>>;
        edit: (
            interaction: ButtonInteraction,
            handler: PresetDialogHandler
        ) => Promise<Ok<void>>;
        rm: (
            interaction: ButtonInteraction,
            handler: PresetDialogHandler
        ) => Promise<Ok<void>>;
        list: (
            interaction: ButtonInteraction,
            handler: PresetDialogHandler
        ) => Promise<Ok<void>>;
    };
    export type execute = (
        interaction: ChatInputCommandInteraction
    ) => Promise<Ok<void>>;
}
//#endregion
//#region           Variables
const commandName = "autoreport";
const commandLabel = "Reação Automática";
//#endregion
//#region           Implementation
export const data: types.data = async () => {
    const description = {
        comm: "Adicione emotes automáticos!",
    };
    return new Ok({
        properties: {
            guild: false,
        },
        slashData: new SlashCommandBuilder()
            .setName("autoemote")
            .setDescription(description.comm)
            .setDefaultMemberPermissions(0)
            .setDMPermission(false),
    });
};
export const action: types.actionFunction = async (params) => {
    const typeErr: DefaultErr = {
        message: "O valor recebido não é do tipo requerido!",
        origin: ErrorOrigin.Internal,
        kind: ErrorKind.TypeError,
    };

    // Receive Preset data
    {
        const chatNotFound =
            "Algo de errado aconteceu!" +
            "Na requisição de verificação, o chat existia, porém não mais!";
        const emojiNotFound =
            "Algo de errado aconteceu!" +
            "Na requisição de verificação, o emoji existia, porém não mais!";
        const wrongTypeErr = "Você precisa entregar um canal de texto!";

        var chat: TextBasedChannel;

        const getChat = await client.channels.fetch(params.chatID);
        if (!getChat) {
            throw new BotErr({
                message: chatNotFound,
                origin: ErrorOrigin.External,
                kind: ErrorKind.NotFound,
            });
        }
        if (getChat.isTextBased()) {
            chat = getChat;
        } else {
            throw new BotErr({
                message: wrongTypeErr,
                origin: ErrorOrigin.User,
                kind: ErrorKind.TypeError,
            });
        }

        var emoji: string | GuildEmoji;
        if (params.customEmoji && params.emojiID) {
            const getEmoji = client.emojis.resolve(params.emojiID);

            if (!getEmoji)
                throw new BotErr({
                    message: emojiNotFound,
                    origin: ErrorOrigin.External,
                    kind: ErrorKind.NotFound,
                });

            emoji = params.emojiID;
        } else {
            emoji = params.emoji;
        }

        var executionParams = {
            name: params.name,
            chat,
            emoji,
            customEmoji: params.customEmoji,
        };
    }

    const actionOnUserReaction = async (
        reaction: MessageReaction,
        user: User
    ): Promise<Ok<void>> => {
        if (reaction.message.channel.id !== params.chatID) {
            return Ok.EMPTY;
        }
        if (user.bot) {
            return Ok.EMPTY;
        }

        // Update database
        {
            // Get data
            const dataTable = await prisma.autoReportPresetData.findUnique({
                where: { name: params.name },
            });
            if (!dataTable) throw new BotErr(errors.presetNotFound);

            // Update alreadyReported messages
            if (!Array.isArray(dataTable.alreadyReported))
                throw new BotErr(typeErr);

            dataTable.alreadyReported.push(reaction.message.id);

            // Update noReported messages
            if (!Array.isArray(dataTable.noReported)) throw new BotErr(typeErr);

            dataTable.noReported.splice(
                dataTable.noReported.indexOf(reaction.message.id),
                1
            );

            // Apply
            await prisma.autoReportPresetData.update({
                where: { name: params.name },
                data: {
                    alreadyReported: dataTable.alreadyReported,
                    noReported: dataTable.noReported,
                },
            });
        }

        return Ok.EMPTY;
    };

    // Create Listeners
    {
        const middleActionOnFirstReaction: reactTypes.ActionBeforeReact =
            async (message) => {
                // const DataHandler = new DataBowlHandler(commandName);

                // const oldMessages = (await DataHandler.Get(params.name)).val
                //     .object.data.messages;

                // if (!Array.isArray(oldMessages))
                //     throw new BotErr({
                //         message:
                //             "The old messages array... Is not an array.",
                //         origin: ErrorOrigin.Internal,
                //         kind: ErrorKind.TypeError,
                //     });

                // await DataHandler.Set(
                //     params.name,
                //     [...oldMessages, message.id],
                //     "messages"
                // );

                // Do nothing yet

                return Ok.EMPTY;
            };

        const actionOnFirstReaction = await react.reactOnNewMessage(
            executionParams,
            middleActionOnFirstReaction
        );

        // React to new messages
        new ListenerHandler(
            Events.MessageCreate,
            `${Events.MessageCreate}-${params.name}`
        ).NewOn(actionOnFirstReaction.val);
        // Wait user reactions
        new ListenerHandler(
            Events.MessageReactionAdd,
            `${Events.MessageReactionAdd}-${params.name}`
        ).NewOn(actionOnUserReaction);
    }

    return Ok(actionOnUserReaction);
};
export const subActions: Factory<types.subActions> = () => {
    const factory: FactoryObj<types.subActions> = {
        add: async (interaction, handler) => {
            const typeOptions = [
                {
                    label: commandLabel,
                    description: "Me faça reagir às mensagens no chat!",
                    value: "link",
                },
            ];
            const channelData = {
                description:
                    "Escolha o canal em que você deseja que " +
                    "eu fique reagindo às mensagens!",
            };

            // Get Data
            try {
                const presetName = await handler.DataDialog().PresetName();
                const channel = await handler
                    .DataDialog()
                    .Channels(channelData);

                // Get emoji
                {
                    const emojiQuestionEmbed = (
                        await new EmbedMessagesHandler(
                            "presetDialog.getEmojiQuestion"
                        ).Mount({})
                    ).unwrap().embedData;
                    let receivedEmoji = (
                        await handler.DataDialog().String(emojiQuestionEmbed)
                    ).val;

                    for (let attempt = 1; ; attempt++) {
                        if (attempt > 5) {
                            const embed = (
                                await new EmbedMessagesHandler(
                                    "presetDialog.err.tooManyAttempts"
                                ).Mount({})
                            ).unwrap().embedData;

                            interaction.editReply({
                                embeds: [embed],
                                components: [],
                                content: "",
                            });

                            throw new BotErr({
                                message: "Número de tentativas ultrapassado!",
                                origin: ErrorOrigin.User,
                                kind: ErrorKind.BlockedAction,
                            });
                        }

                        var sanitizedEmoji =
                            filter.sanitizeEmoji(receivedEmoji).val;
                        var emojiId = sanitizedEmoji.filteredEmoji.id;
                        var customEmoji = verify.customEmojiExists(
                            interaction,
                            sanitizedEmoji.filteredEmoji.name
                        ).val;

                        if (
                            sanitizedEmoji.emojiFormat === false ||
                            (sanitizedEmoji.emojiFormat === "custom" &&
                                !customEmoji)
                        ) {
                            const embed = (
                                await new EmbedMessagesHandler(
                                    "errors.emojiNotFound"
                                ).Mount({ emojiName: receivedEmoji })
                            ).unwrap().embedData;

                            embed.description += `\n\n**Você tem mais #${
                                5 - attempt
                            } tentativas!**`;

                            handler.interaction.editReply({
                                embeds: [embed],
                                components: [],
                                content: "",
                            });

                            receivedEmoji = (
                                await handler
                                    .DataDialog()
                                    .String(emojiQuestionEmbed)
                            ).val;
                        } else {
                            break;
                        }
                    }
                }

                const executionParams = {
                    name: presetName.val,
                    chatID: channel.val,
                    emoji: sanitizedEmoji.filteredEmoji.name,
                    emojiId: customEmoji ? emojiId : undefined,
                    customEmoji:
                        customEmoji !== undefined ? customEmoji : undefined,
                };
                await action(executionParams);
            } catch (err) {
                if (err instanceof BotErr) {
                    if (err.val.kind === ErrorKind.CanceledAction) {
                        return Ok.EMPTY;
                    }
                } else {
                    throw err;
                }
            }

            return Ok.EMPTY;
        },
        edit: async (interaction, handler) => {
            return Ok.EMPTY;
        },
        rm: async (interaction, handler) => {
            return Ok.EMPTY;
        },
        list: async (interaction, handler) => {
            return Ok.EMPTY;
        },
    };
    return factory;
};
export const execute: types.execute = async (interaction) => {
    const sActions = subActions();
    const getEphemeral = interaction.options.getBoolean("ephemeral");
    await interaction.deferReply({
        ephemeral: getEphemeral !== null ? getEphemeral : true,
    });

    const handler = new PresetDialogHandler(
        interaction,
        commandName,
        commandLabel
    );
    const getAction = await handler.GetActionDialog();

    var result: Ok<void>;

    switch (getAction.val.customID) {
        case "add":
            result = await sActions.add(getAction.val.interaction, handler);
            break;
        case "edit":
            result = await sActions.edit(getAction.val.interaction, handler);
            break;
        case "rm":
            result = await sActions.rm(getAction.val.interaction, handler);
            break;
        case "list":
            result = await sActions.list(getAction.val.interaction, handler);
            break;
        default:
            throw new BotErr({
                message: "Nenhuma ação foi atingida!",
                kind: ErrorKind.LogicError,
                origin: ErrorOrigin.Internal,
            });
    }

    await handler.SuccessDialog();

    return new Ok(result.val);
};
//#endregion

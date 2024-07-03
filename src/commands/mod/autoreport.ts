/** @format */
//#region           External Libs
import {
    APIEmbed,
    AutocompleteInteraction,
    ChannelType,
    ChatInputCommandInteraction,
    Events,
    GuildEmoji,
    Message,
    MessageReaction,
    SlashCommandBuilder,
    Snowflake,
    TextBasedChannel,
    TextChannel,
    User,
} from "discord.js";
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import reqs from "@/system/factories/rest.f";
import react from "@/external/factories/react.f";
import filter from "@/system/factories/filter.f";
import string from "@/system/factories/string.f";
import verify from "@/system/factories/verify.f";
import messagesLib from "@/external/factories/preseted.f";
import presetCommandTemplate from "@/system/factories/presetCommandTemplate.f";
import {
    DefaultErr,
    Err,
    ErrorKind,
    ErrorOrigin,
} from "@/system/handlers/errHandlers";
import { Log } from "@/system/handlers/log";
import { client } from "//index";
import { PresetHandler } from "@/system/handlers/presetHandler";
import { ListenerHandler } from "@/system/handlers/listener";
import { DataBowlHandler } from "@/system/handlers/dataBowl";
//#endregion
//#region           Typing
import { types as reactTypes } from "@/external/factories/react.f";
import { types as presetTypes } from "@/system/components/preset";
import { types as commandTypes } from "@/system/handlers/command";
export namespace types {
    export type PresetParams = {
        name: string;
        chat: TextBasedChannel;
        logChat: TextBasedChannel;
        emoji: string | Snowflake;
        customEmoji?: boolean;
    };

    export type ReceivedStoredParams = {
        name: string;
        chatID: string;
        logChatID: string;
        emoji: string;
        emojiID?: string;
        customEmoji?: boolean;
    };

    export type ReceivedData = {
        presetName: string;
        chat?: TextChannel;
        logChat?: TextChannel;
        receivedEmoji?: string;
        presetNewName?: string;
    };
    export type PossibleReceivedData = {
        [key: string]: string | TextChannel | undefined;
        presetName: string;
        chat?: TextChannel;
        logChat?: TextChannel;
        receivedEmoji?: string;
        presetNewName?: string;
    };

    // Funções
    export type Utils = {
        /**
         * Receive data from interaction object and return it.
         * @param interaction - Object of the interaction
         * @param isRequired - An array with the indexes of the properties that are required ->
         * *[0 = chat, 1 = logChat, 2 = emoji, 3 = preset-new-name]*
         */
        receiveData: (
            interaction: ChatInputCommandInteraction,
            isRequired: boolean[]
        ) => Ok<types.ReceivedData>;
    };
    export type SubCommands = {
        new: (interaction: ChatInputCommandInteraction) => Promise<Ok<string>>;
        edit: (interaction: ChatInputCommandInteraction) => Promise<Ok<string>>;
        rm: (interaction: ChatInputCommandInteraction) => Promise<Ok<string>>;
        list: (
            interaction: ChatInputCommandInteraction
        ) => Promise<Ok<string | APIEmbed>>;
    };

    export type actionListener = (
        message: Message,
        emoji: GuildEmoji | string
    ) => Ok<void>;
    export type data = () => Ok<commandTypes.CommandData<SlashCommandBuilder>>;
    export type actionFunction = (
        params: types.ReceivedStoredParams
    ) => Promise<Ok<AnyFunction>>;
    export type execute = (
        interaction: ChatInputCommandInteraction
    ) => Promise<Ok<void>>;
    export type autocomplete = (
        interaction: AutocompleteInteraction
    ) => Promise<Ok<void>>;
}
//#endregion
//#region           Variables
import messages from "D/messages/normal.json";
const commandName = "autoreport";
//#endregion
//#region           Implementation
export const data: types.data = () => {
    const description = {
        comm: "Cria um preset para eu reagir nos chats!",
        ephemeral:
            "Deseja que eu esconda essa mensagem dos outros? (padrão: sim)",
        new: {
            subc: "Crie um novo preset para eu reagir às mensagens!",
            preset:
                "Dê um nome único para esse preset. " +
                "Pode conter: maiúsculas, minúsculas, sublinhados e números)!",
            chat: "Chat onde os usuários terão reações de reportar em suas mensagens :)",
            logChat: "Chat onde irei dedurar o usuário para a staff! >:)",
            emote: "Reação que usarei para os usuários poderem reportar alguém.",
        },
        edit: {
            subc: "Edita o preset que você criou para eu reagir nos chats!",
            preset: "Qual preset você deseja editar?",
            chat: "Qual será o novo chat para eu vigiar?",
            logChat: "Qual será o novo chat para eu dedurar os membros?",
            emote: "Qual vai ser a nova reação?",
            presetNewName: "Qual será o novo nome do preset?",
        },
        remove: {
            subc: "Remove o preset que você criou para eu reagir nos chats!",
            preset: "Qual preset você deseja remover?",
            removePrevious:
                "Você deseja que eu faça com que as mensagens já reagidas " +
                "parem de ser reportadas?",
        },
        list: {
            subc: "Lista todos os presets que você criou para eu reagir nos chats!",
            withOlds:
                "Decida se você quer que eu inclua os presets que " +
                "não foram totalmente removidos.",
        },
    };

    return Ok({
        properties: {
            guild: false,
        },
        slashData: new SlashCommandBuilder()
            .setName(commandName)
            .setDescription(description.comm)
            .addSubcommand((New) =>
                New.setName("new")
                    .setDescription(description.new.subc)
                    .addStringOption((presetName) =>
                        presetName
                            .setName("preset-name")
                            .setDescription(description.new.preset)
                            .setRequired(true)
                    )
                    .addChannelOption((chat) =>
                        chat
                            .setName("chat")
                            .setDescription(description.new.chat)
                            .addChannelTypes(ChannelType.GuildText)
                            .setRequired(true)
                    )
                    .addChannelOption((logChat) =>
                        logChat
                            .setName("log-chat")
                            .setDescription(description.new.logChat)
                            .addChannelTypes(ChannelType.GuildText)
                            .setRequired(true)
                    )
                    .addStringOption((emote) =>
                        emote
                            .setName("emote")
                            .setDescription(description.new.emote)
                            .setRequired(true)
                    )
                    .addBooleanOption((ephemeral) =>
                        ephemeral
                            .setName("ephemeral")
                            .setDescription(description.ephemeral)
                            .setRequired(false)
                    )
            )
            .addSubcommand((edit) =>
                edit
                    .setName("edit")
                    .setDescription(description.edit.subc)
                    .addStringOption((presetName) =>
                        presetName
                            .setName("preset-name")
                            .setDescription(description.edit.preset)
                            .setAutocomplete(true)
                            .setRequired(true)
                    )
                    .addChannelOption((chat) =>
                        chat
                            .setName("chat")
                            .setDescription(description.edit.chat)
                            .addChannelTypes(ChannelType.GuildText)
                    )
                    .addChannelOption((logChat) =>
                        logChat
                            .setName("log-chat")
                            .setDescription(description.edit.logChat)
                            .addChannelTypes(ChannelType.GuildText)
                    )
                    .addStringOption((emote) =>
                        emote
                            .setName("emote")
                            .setDescription(description.edit.emote)
                    )
                    .addStringOption((presetNewName) =>
                        presetNewName
                            .setName("preset-new-name")
                            .setDescription(description.edit.presetNewName)
                    )
                    .addBooleanOption((ephemeral) =>
                        ephemeral
                            .setName("ephemeral")
                            .setDescription(description.ephemeral)
                            .setRequired(false)
                    )
            )
            .addSubcommand((remove) =>
                remove
                    .setName("remove")
                    .setDescription(description.remove.subc)
                    .addStringOption((presetName) =>
                        presetName
                            .setName("preset-name")
                            .setDescription(description.remove.preset)
                            .setAutocomplete(true)
                            .setRequired(true)
                    )
                    .addBooleanOption((removePrevious) =>
                        removePrevious
                            .setName("remove-previous")
                            .setDescription(description.remove.removePrevious)
                    )
                    .addBooleanOption((ephemeral) =>
                        ephemeral
                            .setName("ephemeral")
                            .setDescription(description.ephemeral)
                            .setRequired(false)
                    )
            )
            .addSubcommand((list) =>
                list
                    .setName("list")
                    .setDescription(description.list.subc)
                    .addBooleanOption((withOlds) =>
                        withOlds
                            .setName("with-olds")
                            .setDescription(description.list.withOlds)
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
        {
            if (!getChat) {
                throw new Err({
                    message: chatNotFound,
                    origin: ErrorOrigin.External,
                    kind: ErrorKind.NotFound,
                });
            }
            if (getChat.isTextBased()) {
                chat = getChat;
            } else {
                throw new Err({
                    message: wrongTypeErr,
                    origin: ErrorOrigin.User,
                    kind: ErrorKind.TypeError,
                });
            }
        }

        var logChat: TextBasedChannel;
        const getLogChat = await client.channels.fetch(params.logChatID);
        {
            if (!getLogChat) {
                throw new Err({
                    message: chatNotFound,
                    origin: ErrorOrigin.External,
                    kind: ErrorKind.NotFound,
                });
            }
            if (getLogChat.isTextBased()) {
                logChat = getLogChat;
            } else {
                throw new Err({
                    message: wrongTypeErr,
                    origin: ErrorOrigin.User,
                    kind: ErrorKind.TypeError,
                });
            }
        }

        var emoji: string | GuildEmoji;
        if (params.customEmoji && params.emojiID) {
            const getEmoji = client.emojis.resolve(params.emojiID);

            if (!getEmoji)
                throw new Err({
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
            logChat,
            emoji,
            customEmoji: params.customEmoji,
        };
    }

    const middleActionOnFirstReaction: reactTypes.ActionBeforeReact = async (
        message
    ) => {
        const dataHandler = new DataBowlHandler(commandName);

        const oldMessages = (await dataHandler.Get(params.name)).val.object.data[
            "messages"
        ];
        if (!Array.isArray(oldMessages)) throw new Err(typeErr);

        oldMessages.push(message.id);

        await dataHandler.Set(params.name, oldMessages, "messages");

        return Ok.EMPTY;
    };
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

        const message = (
            await reqs.getMessage(
                reaction.message.channel.id,
                reaction.message.id
            )
        ).val;

        const reason = await messagesLib.normal.sendReasonQuestion(
            message,
            user,
            {
                action: actionOnUserReaction,
                actionParams: executionParams,
                middleAction: middleActionOnFirstReaction,
            }
        );
        const dataHandler = new DataBowlHandler(commandName);

        // Writing to the database
        {
            // Put on 'alreadyReported'
            const alreadyReported = (await dataHandler.Get(params.name)).val
                .object.data.alreadyReported;

            if (!Array.isArray(alreadyReported)) throw new Err(typeErr);

            alreadyReported.push(reaction.message.id);

            await dataHandler.Set(
                params.name,
                alreadyReported,
                "alreadyReported"
            );

            // Remove from 'messages'
            const messages = (await dataHandler.Get(params.name)).val.object
                .data.messages;

            if (!Array.isArray(messages)) throw new Err(typeErr);

            messages.splice(messages.indexOf(reaction.message.id), 1);

            await dataHandler.Set(params.name, messages, "messages");
        }

        // Cancel the report if the user requested
        if (!reason.val) return Ok.EMPTY;

        messagesLib.embed.sendReportMessage({
            interaction: reaction,
            user,
            logChat,
            reason: reason.val,
        });

        return Ok.EMPTY;
    };

    // Create Listeners
    {
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
export const utils: types.Utils = {
    receiveData: (interaction, isRequired: boolean[]) => {
        const textBasedErr = {
            message: "This channel is not text based!",
            origin: ErrorOrigin.External,
            kind: ErrorKind.TypeError,
        };

        // Receber os dados
        const presetName = interaction.options.getString("preset-name", true);
        const chat = interaction.options.getChannel("chat", isRequired[0]);
        const logChat = interaction.options.getChannel(
            "log-chat",
            isRequired[1]
        );
        const receivedEmoji = interaction.options.getString(
            "emote",
            isRequired[2]
        );
        const presetNewName = interaction.options.getString(
            "preset-new-name",
            isRequired[3]
        );

        if (chat && !(chat instanceof TextChannel)) throw new Err(textBasedErr);
        if (logChat && !(logChat instanceof TextChannel))
            throw new Err(textBasedErr);

        const data: Record<string, string | TextChannel | null> = {
            presetName,
            chat,
            logChat,
            receivedEmoji,
            presetNewName,
        };
        const newData: types.PossibleReceivedData = {
            presetName,
        };

        for (const obj in data) {
            if (obj === "presetName") continue;

            const newValue = data[obj];
            if (obj !== undefined && newValue !== null) {
                newData[obj] = newValue;
            }
        }

        return Ok(newData);
    },
};
const subCommands: Factory<types.SubCommands> = () => {
    const presetTemplate = presetCommandTemplate(commandName);
    const noReceivedRequiredParams: DefaultErr = {
        message:
            "Por algum motivo os parâmetros obrigatórios não foram recebidos.",
        origin: ErrorOrigin.External,
        kind: ErrorKind.MissingParam,
    };

    const factory: FactoryObj<types.SubCommands> = {
        new: async (interaction) => {
            var { presetName, chat, logChat, receivedEmoji } =
                utils.receiveData(interaction, [true, true, true]).val;

            if (!chat || !logChat || !receivedEmoji)
                throw new Err(noReceivedRequiredParams);

            const sanitizedEmoji = filter.sanitizeEmoji(receivedEmoji).val;
            const emojiId = sanitizedEmoji.filteredEmoji.id;
            const customEmoji = verify.customEmojiExists(
                interaction,
                sanitizedEmoji.filteredEmoji.name
            ).val;

            const presetParams = {
                chatID: chat.id,
                logChatID: logChat.id,
                emoji: sanitizedEmoji.filteredEmoji.name,
                emojiID: emojiId ? emojiId : undefined,
                customEmoji,
            };

            const initialDataBowl = {
                alreadyReported: [],
                messages: [],
            };

            const response = await presetTemplate.new(
                presetName,
                presetParams,
                initialDataBowl
            );

            await action({
                name: presetName,
                ...presetParams,
            });

            return Ok(response.val);
        },
        edit: async (interaction) => {
            // Receber Dados
            const receivedData: types.ReceivedData = utils.receiveData(
                interaction,
                [false, false, false, false]
            ).val;

            //#region   Verificações
            {
                // Tentativa de editar um preset parcialmente removido
                if (receivedData.presetName.startsWith("old_")) {
                    const getMessage = string.varInterpreter(
                        messages.commands.mod.autoreport.warns
                            .partialEditRemoval,
                        { presetName: receivedData.presetName }
                    );

                    throw new Err({
                        message: getMessage.val,
                        origin: ErrorOrigin.User,
                        kind: ErrorKind.GhostEditing,
                    });
                }

                // Mínimo de parâmetros opcionais
                if (
                    !(
                        receivedData.chat ||
                        receivedData.logChat ||
                        receivedData.presetNewName ||
                        receivedData.receivedEmoji
                    )
                ) {
                    throw new Err({
                        message:
                            messages.commands.mod.autoreport.warns
                                .minimalOptionalParam,
                        origin: ErrorOrigin.User,
                        kind: ErrorKind.NotEnoughArgs,
                    });
                }
            }
            //#endregion

            var sanitizeReceivedEmoji = receivedData.receivedEmoji
                ? filter.sanitizeEmoji(receivedData.receivedEmoji).val
                : null;
            const receivedCustomEmoji = sanitizeReceivedEmoji
                ? verify.customEmojiExists(
                      interaction,
                      sanitizeReceivedEmoji.filteredEmoji.name
                  ).val
                : null;

            const editedPreset = await presetTemplate.edit(
                receivedData.presetName,
                {
                    chatID: receivedData.chat ? receivedData.chat.id : null,
                    logChatID: receivedData.logChat
                        ? receivedData.logChat.id
                        : null,
                    presetNewName: receivedData.presetNewName,
                    emoji: sanitizeReceivedEmoji
                        ? sanitizeReceivedEmoji.filteredEmoji.name
                        : null,
                    emojiID: sanitizeReceivedEmoji
                        ? sanitizeReceivedEmoji.filteredEmoji.id
                        : undefined,
                    customEmoji:
                        sanitizeReceivedEmoji &&
                        typeof receivedCustomEmoji === "boolean"
                            ? receivedCustomEmoji
                            : null,
                }
            );

            const newObj = editedPreset.val.obj;
            if (!newObj)
                throw new Err({
                    message:
                        "Algo de errado aconteceu! O editPreset não retornou o objeto.",
                    origin: ErrorOrigin.Internal,
                    kind: ErrorKind.Other,
                });

            if (typeof newObj.emoji === "string") {
                var sanitizedEmoji = filter.sanitizeEmoji(newObj.emoji).val;
            } else {
                throw new Err({
                    message:
                        "Something is wrong! The emoji cannot be sanitized.",
                    origin: ErrorOrigin.Internal,
                    kind: ErrorKind.Other,
                });
            }

            const customEmoji = verify.customEmojiExists(
                interaction,
                sanitizedEmoji.filteredEmoji.name
            ).val;

            if (
                typeof newObj.chatID !== "string" ||
                typeof newObj.logChatID !== "string" ||
                (newObj.emojiID !== null &&
                    newObj.emojiID !== undefined &&
                    typeof newObj.emojiID !== "string")
            )
                throw new Err({
                    message:
                        "Something is wrong! One of the IDs is not a Snowflake.",
                    origin: ErrorOrigin.Internal,
                    kind: ErrorKind.Other,
                });

            const executionParams = {
                name: newObj.presetName,
                chatID: newObj.chatID,
                logChatID: newObj.logChatID,
                emoji: "",
                emojiID: newObj.emojiID ? newObj.emojiID : undefined,
                customEmoji,
            };
            if (sanitizedEmoji.filteredEmoji.id)
                executionParams.emoji = sanitizedEmoji.filteredEmoji.id;
            else executionParams.emoji = sanitizedEmoji.filteredEmoji.name;

            if (sanitizedEmoji.emojiFormat === "custom" && !customEmoji) {
                const getMessage = string.varInterpreter(
                    messages.commands.mod.autoreport.errors.emojiNotFound,
                    { receivedEmoji: receivedData.receivedEmoji }
                );

                throw new Err({
                    message: getMessage.val,
                    origin: ErrorOrigin.User,
                    kind: ErrorKind.NotFound,
                });
            }

            new ListenerHandler(
                Events.MessageCreate,
                `${Events.MessageCreate}-${receivedData.presetName}`
            ).Remove();
            new ListenerHandler(
                Events.MessageReactionAdd,
                `${Events.MessageReactionAdd}-${receivedData.presetName}`
            ).Remove();

            await action(executionParams);

            const sucessMessage = string.varInterpreter(
                messages.commands.mod.autoreport.sucess.presetEdited,
                { presetName: receivedData.presetName }
            );

            return Ok(sucessMessage.val);
        },
        rm: async (interaction) => {
            const presetName = interaction.options.getString(
                "preset-name",
                true
            );
            const removePrevious =
                interaction.options.getBoolean("remove-previous");

            const removePreset = await presetTemplate.remove(
                presetName,
                removePrevious
            );

            new ListenerHandler(
                Events.MessageCreate,
                `${Events.MessageCreate}-${presetName}`
            ).Remove();
            new ListenerHandler(
                Events.MessageReactionAdd,
                `${Events.MessageReactionAdd}-${presetName}`
            ).Remove();

            if (removePreset.ok) {
                return Ok(removePreset.val);
            } else {
                return removePreset;
            }
        },
        list: async (interaction) => {
            const withOlds = interaction.options.getBoolean("with-olds");

            const presetList = await presetTemplate.list(withOlds);

            const messageEmbed = await messagesLib.embed.sendListMessage(
                {
                    commandName,
                    presetList: presetList.val,
                },
                interaction,
                true
            );

            return Ok(messageEmbed.val.embedData);
        },
    };
    return factory;
};
export const execute: types.execute = async (interaction) => {
    const scomms = subCommands();
    const subcommand = interaction.options.getSubcommand(true);

    var response: Ok<string | APIEmbed>;
    const getEphemeral = interaction.options.getBoolean("ephemeral");
    await interaction.deferReply({
        ephemeral: getEphemeral !== null ? getEphemeral : true,
    });
    switch (subcommand) {
        case "new":
            response = await scomms.new(interaction);
            break;
        case "edit":
            response = await scomms.edit(interaction);
            break;
        case "remove":
            response = await scomms.rm(interaction);
            break;
        case "list":
            response = await scomms.list(interaction);
            break;
        default:
            throw new Err({
                message: "Nenhum subcomando foi atingido!",
                origin: ErrorOrigin.Internal,
                kind: ErrorKind.LogicError,
            });
    }

    if (typeof response.val === "object")
        await interaction.editReply({ embeds: [response.val] });
    else await interaction.editReply(response.val);

    new Log("interaction.usedCommand").Print({
        user: interaction.user.username,
        commandName: subcommand,
    });

    return Ok.EMPTY;
};
export const autocomplete: types.autocomplete = async (interaction) => {
    const focused = interaction.options.getFocused(true);
    const list: presetTypes.PresetInfo[] = (
        await new PresetHandler(commandName).List()
    ).val;

    const subComm = interaction.options.getSubcommand();

    if (subComm === "remove") {
        if (focused.name === "preset-name") {
            await interaction.respond(
                list.map((value) => ({
                    value: value.name,
                    name: value.name,
                }))
            );
        }
    } else if (subComm === "edit") {
        if (focused.name === "preset-name") {
            await interaction.respond(
                list
                    .filter((value) => !value.name.startsWith("old_"))
                    .map((value) => ({ value: value.name, name: value.name }))
            );
        }
    }

    return Ok.EMPTY;
};
//#endregion

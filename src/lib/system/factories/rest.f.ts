/** @format */

//#region           External Libs
import { Ok } from "ts-results";
import { DiscordAPIError, Message } from "discord.js";
//#endregion
//#region           Modules
import { client } from "//index";
import {
    DefaultErr,
    BotErr,
    ErrorOrigin,
    ErrorKind,
} from "@/system/handlers/errHandlers";
//#endregion
//#region           Types
export namespace types {
    export interface Functions {
        /**
         * Use a chat and message ID to get a message.
         * @param chatId Chat ID.
         * @param messageId Message ID.
         */
        getMessage: (chatId: string, messageId: string) => Promise<Ok<Message>>;
    }
}
//#endregion
//#region           Variables
export const errors: Record<string, DefaultErr> = {
    chatNotFound: {
        message: "The chat doesn't exist!",
        origin: ErrorOrigin.External,
        kind: ErrorKind.NotFound,
    },
    messageNotFound: {
        message: "The message doesn't exist!",
        origin: ErrorOrigin.External,
        kind: ErrorKind.NotFound,
    },
    noMessages: {
        message: "The chat doesn't have messages!",
        origin: ErrorOrigin.External,
        kind: ErrorKind.EmptyValue,
    },
};
//#endregion
//#region           Implementation
const Default: Factory<types.Functions> = () => {
    const factory: FactoryObj<types.Functions> = {
        getMessage: async (chatId, messageId) => {
            try {
                const chat = await client.channels.fetch(chatId);
                if (chat === null) throw new BotErr(errors.chatNotFound);
                if (!("messages" in chat)) throw new BotErr(errors.noMessages);

                const message = await chat.messages.fetch(messageId);
                if (message === null) throw new BotErr(errors.messageNotFound);

                return new Ok(message);
            } catch (err) {
                if (err instanceof DiscordAPIError) {
                    if (err.code === 10003) {
                        throw new BotErr(errors.chatNotFound);
                    } else if (err.code === 10008) {
                        throw new BotErr(errors.messageNotFound);
                    } else {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }
        },
    };

    return factory;
};
export default Default();
//#endregion

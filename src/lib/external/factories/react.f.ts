/** @format */
//#region           External Libs
import { Ok } from "ts-results";
import { Message, MessageFlags, Snowflake, TextBasedChannel } from "discord.js";
//#endregion
//#region           Modules
import { client } from "//index";
import { BotErr, ErrorKind, ErrorOrigin } from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export type ReactOnChatParams = {
        chat: TextBasedChannel;
        emoji: string | Snowflake;
        customEmoji?: boolean;
    };
    export type ActionBeforeReact = (message: Message) => Promise<Ok<void>>;
    export type ReactionFuns = {
        /**
         * Listener function to react to the
         * AutoReport Preset messages.
         */
        reactOnNewMessage: <T>(
            params: ReactOnChatParams & T,
            actionBeforeReact: ActionBeforeReact
        ) => Promise<Ok<AnyFunction>>;
    };
}
//#endregion
//#region           Implementation
const Default: Factory<types.ReactionFuns> = () => {
    const factory: FactoryObj<types.ReactionFuns> = {
        reactOnNewMessage: async (params, actionBeforeReact) => {
            const listenerFunction = async (
                message: Message
            ): Promise<Ok<void>> => {
                const flags = message.flags;
                const msgChatId = message.channel.id;
                const presetChatId = params.chat.id;

                const execCondition =
                    flags &&
                    !flags.has(MessageFlags.Ephemeral) &&
                    msgChatId === presetChatId;
                if (execCondition) {
                    await actionBeforeReact(message);

                    if (params.customEmoji) {
                        const emoji = client.emojis.resolve(params.emoji);
                        if (!emoji)
                            throw new BotErr({
                                message:
                                    "An emoji that the preset depends on doesn't exist!",
                                origin: ErrorOrigin.User,
                                kind: ErrorKind.NotFound,
                            });

                        await message.react(`${emoji.name}:${emoji.id}`);
                    } else {
                        await message.react(params.emoji);
                    }
                }

                return Ok.EMPTY;
            };

            return Ok(listenerFunction);
        },
    };

    return factory;
};
export default Default();
//#endregion

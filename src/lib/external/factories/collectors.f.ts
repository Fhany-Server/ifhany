/** @format */
//#region           External Libs
import { Ok } from "ts-results";
import { GuildEmoji, Message, MessageReaction, User } from "discord.js";
//#endregion
//#region           Typing
export namespace types {
    export type ObserversFuns = {
        /**
         * Await a reaction in a specific message.
         *
         * **This will be replaced later**
         * @param params
         * @param callback
         */
        awaitReaction: (
            params: {
                message: Message;
                emoji: string | GuildEmoji;
                maxReactions: number;
            },
            callback: AnyFunction
        ) => Ok<void>;
    };
}
//#endregion
//#region           Implementation
const Default: Factory<types.ObserversFuns> = () => {
    const factory: FactoryObj<types.ObserversFuns> = {
        awaitReaction: (params, callback) => {
            const emojiName =
                typeof params.emoji === "object"
                    ? params.emoji.name
                    : params.emoji;

            const collectorFilter = (
                reaction: MessageReaction,
                user: User
            ): boolean => {
                return reaction.emoji.name === emojiName && !user.bot;
            };
            const collector = params.message.createReactionCollector({
                filter: collectorFilter,
                max: params.maxReactions,
            });

            collector.on("collect", callback);

            return Ok.EMPTY;
        },
    };

    return factory;
};
export default Default();
//#endregion

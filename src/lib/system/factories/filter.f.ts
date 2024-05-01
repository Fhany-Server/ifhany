/** @format */
//#region           External Libs
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import verify from "@/system/factories/verify.f";
import filter from "@/system/factories/filter.f";
//#endregion
//#region           Typing
export namespace types {
    export type FilteredEmoji = {
        name: string;
        id?: string;
    };
    export type EmojiFormat = "custom" | "unicode" | false;
    export type SanitizedEmoji = {
        filteredEmoji: FilteredEmoji;
        emojiFormat: EmojiFormat;
    };

    export interface Functions {
        /**
         * Filter an emoji.
         *
         * It will return an object that will separate
         * the name from a possible id (if it's a custom emoji)
         * and will remove the characters that Discord uses to
         * identify an emoji (`<,:,>`)
         * @param emoji String of the emoji.
         * @example
         * const emoji = "<:emoji:123456789>"
         * const filteredEmoji = filter.customEmoji(emoji).val
         *
         * console.log(filteredEmoji)
         * // {
         * //     name: "emoji",
         * //     id: "123456789"
         * //}
         */
        customEmoji: (emoji: string) => Ok<types.FilteredEmoji>;
        /**
         * Sanitize an emoji.
         *
         * This merged function will use `filter.customEmoji`
         * and `verify.emojiFormat` to return
         * the emoji name, id and format.
         * @param receivedEmoji String of the emoji.
         * @example
         * const emoji = "<:emoji:123456789>"
         * const sanitizedEmoji = filter.sanitizeEmoji(emoji).val
         *
         * console.log(sanitizedEmoji)
         * // {
         * // filteredEmoji: {
         * //     name: "emoji",
         * // },
         * // emojiFormat: "custom"
         * // }
         */
        sanitizeEmoji: (receivedEmoji: string) => Ok<types.SanitizedEmoji>;
    };
}
//#endregion
//#region           Implementation
const Default: Factory<types.Functions> = () => {
    const factory: FactoryObj<types.Functions> = {
        customEmoji: (emoji) => {
            const obj: types.FilteredEmoji = {
                name: "",
            };

            obj.name = emoji.replace(/\\/g, "");
            obj.name = obj.name.replace(/[<>]/g, "");

            // Adds ID if it's a custom emoji
            if (/:\d+/g.test(obj.name))
                obj.id = obj.name.replace(/[^0-9]+|[_:]/g, "");

            obj.name = obj.name.replace(/[:\d+]/g, "");

            return Ok(obj);
        },
        sanitizeEmoji: (receivedEmoji) => {
            const filteredEmoji: types.FilteredEmoji =
                filter.customEmoji(receivedEmoji).val;
            const emojiFormat: types.EmojiFormat =
                verify.emojiFormat(receivedEmoji).val;

            return Ok({ filteredEmoji, emojiFormat });
        },
    };

    return factory;
};
export default Default();
//#endregion

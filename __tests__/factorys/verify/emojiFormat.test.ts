/** @format */

import { expect } from "chai";

import verify from "@/system/factories/verify.f";

describe("emojiFormat", () => {
    test("Formato de emoji unicode", () => {
        const emoji = "\u{2601}";

        const result = verify.emojiFormat(emoji);

        expect(result.val).to.deep.equal("unicode");
    });

    test("Formato de emoji customizado", () => {
        const emoji = "possible_name";
        const emojiId = "12345678987654321";

        const firstEmoji = `<:${emoji}:${emojiId}>`;
        const firstResult = verify.emojiFormat(firstEmoji);

        expect(firstResult.val).to.deep.equal("custom");
    });

    test("Formato inexistente", () => {
        const emoji = "mocha_undefined_emoji_test";
        const result = verify.emojiFormat(emoji);

        expect(result.val).to.deep.equal(false);
    });
});

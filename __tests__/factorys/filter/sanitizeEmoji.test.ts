/** @format */

import { expect } from "chai";
import filter from "@/system/factories/filter.f";

describe("sanitizeEmoji", () => {
    test("Caso de um emoji simples", () => {
        const emoji = "☁️";

        const result = filter.sanitizeEmoji(`:${emoji}:`);

        expect(result.val).to.deep.equal({
            filteredEmoji: { name: "☁️" },
            emojiFormat: "unicode"
        });
    });

    test(
        "Caso de um emoji customizado",
        () => {
            const emoji = "possible_name";
            const emojiId = "12345678987654321";

            const result = filter.sanitizeEmoji(`<:${emoji}:${emojiId}>`);

            expect(result.val).to.deep.equal({
                filteredEmoji: { name: emoji, id: emojiId },
                emojiFormat: "custom"
            });
        }
    );
});

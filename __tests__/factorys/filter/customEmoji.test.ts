/** @format */

import { expect } from "chai";

import filter from "@/system/factories/filter.f";

describe("customEmoji", () => {
    test("Caso de emoji unicode simples", () => {
        const string = ":possible_name:";

        const result = filter.customEmoji(string);

        expect(result.val).to.be.ok.and.to.contain({
            name: "possible_name",
        });
    });

    test("Caso de emoji customizado", () => {
        const string = ":possible_name:12345678987654321";

        const result = filter.customEmoji(string);

        expect(result.val).to.be.ok.and.to.contain({
            name: "possible_name",
            id: "12345678987654321",
        });
    });
});

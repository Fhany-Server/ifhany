/** @format */
import mock from "mock-fs";
import { expect } from "chai";

import verify from "@/system/factories/verify.f";

describe("isJSON", () => {
    beforeEach(() => {
        mock({
            "/is/JSON": {
                "archive.json": '{ "example": "any value" }',
            },
            "/is/not/JSON": {
                "archive.txt": "hmmmmm, um texto ae",
            },
        });
    });
    afterEach(() => {
        mock.restore();
    });

    test("É um arquivo JSON", async () => {
        const result = await verify.isJSON("/is/JSON/archive.json");

        expect(result.val).to.deep.equal(true);
    });

    test("Não é um arquivo JSON", async () => {
        const result = await verify.isJSON("/is/not/JSON/archive.txt");

        expect(result.val).to.deep.equal(false);
    });
});

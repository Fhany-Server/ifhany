/** @format */
//#region           External Libs
import mock from "mock-fs";
import { Err } from "@/system/handlers/errHandlers";
//#endregion
//#region           Modules
import read from "@/system/factories/fs/read.f";
//#endregion
//#region           Testing
describe("JSON", () => {
    const validJSON = `{
        "key": "value"
    }`;
    const invalidJSON = `"key": "value"`;
    const noJSON = "Any Text...";

    beforeEach(() => {
        mock({
            "/archives": {
                "valid.json": validJSON,
                "invalid.json": invalidJSON,
                "empty.json": "",
                "noJSON.txt": noJSON,
            },
        });
    });
    afterEach(() => {
        mock.restore();
    });

    test("Sucesso! Arquivo JSON recebido.", async () => {
        const result = await read.JSON("/archives/valid.json");

        expect(result.val).toStrictEqual(JSON.parse(validJSON));
    });
    test("Erro! Json inválido.", async () => {
        var result;
        try {
            result = await read.JSON("/archives/invalid.json");
        } catch (err) {
            if (err instanceof Err) {
                result = err;
            } else {
                throw err;
            }
        }

        expect(result.val).toStrictEqual({
            message: "This is an invalid JSON!",
            type: "internal",
        });
    });
    test("Isso não é um arquivo JSON!", async () => {
        var result;
        try {
            result = await read.JSON("/archives/noJSON.txt");
        } catch (err) {
            if (err instanceof Err) {
                result = err;
            } else {
                throw err;
            }
        }

        expect(result.val).toStrictEqual({
            message: "This is not a JSON file!",
            type: "internal",
        });
    });
});
//#endregion

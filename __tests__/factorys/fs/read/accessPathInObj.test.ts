/** @format */

import read from "@/system/factories/fs/read.f";
import { BotErr } from "@/system/handlers/errHandlers";

describe("accessPathInObj", () => {
    const JSON = {
        key1: "value1",
        key2: {
            subKey1: {
                subKey2: "value1",
            },
        },
        key3: ["arrayValue1", "arrayValue2"],
    };

    test("JSON simples interpretado!", () => {
        const result = read.accessPathInObj("key1", JSON);

        expect(result.val).toStrictEqual("value1");
    });
    test("JSON com objetos dentro interpretado!", function () {
        const result = read.accessPathInObj("key2.subKey1", JSON);

        expect(result.val).toStrictEqual({ subKey2: "value1" });
    });
    test("JSON com array interpretado!", () => {
        const result = read.accessPathInObj("key3[1]", JSON);

        expect(result.val).toStrictEqual("arrayValue2");
    });
    test("Aviso de valor inexistente.", () => {
        var result;
        try {
            result = read.accessPathInObj("noKey", JSON);
        } catch (err) {
            if (err instanceof BotErr) {
                result = err;
            } else {
                throw err;
            }
        }

        expect(result.val).toStrictEqual({
            message: "You're trying to access a value that doesn't exist!",
            type: "internal",
        });
    });
    test("Aviso de sintaxe incorreta.", async function () {
        var result;
        try {
            result = read.accessPathInObj("noKey{0}", JSON);
        } catch (err) {
            if (err instanceof BotErr) {
                result = err;
            } else {
                throw err;
            }
        }

        expect(result.val).toStrictEqual({
            message: "You're not using the right syntax!",
            type: "internal",
        });
    });
});

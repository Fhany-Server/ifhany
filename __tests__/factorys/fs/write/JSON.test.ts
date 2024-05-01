/** @format */
//#region           External Libs
import fs from "fs/promises";
import sinon from "sinon";
import { Err } from "@/system/handlers/errHandlers";
//#endregion
//#region           Modules
import write from "@/system/factories/fs/write.f";
//#endregion
//#region           Testing
describe("JSON", () => {
    test("Escrita bem sucedida.", async () => {
        const fsMock = sinon.mock(fs);

        const objToWrite = { key: "Aqui está o valor!" };

        fsMock
            .expects("writeFile")
            .once()
            .withArgs("ficticious.json", JSON.stringify(objToWrite));

        const result = await write.JSON("ficticious.json", objToWrite);

        fsMock.verify();

        expect(result.ok).toBe(true);
    });
    test("Aviso de escita malsucedida", async () => {
        const fsMock = sinon.mock(fs);

        const objToWrite = { key: "Aqui está o valor!" };

        fsMock.expects("writeFile").once().rejects(new Error("EACCES"));

        var result;
        try {
            result = await write.JSON("ficticious.json", objToWrite);

            if (result.ok) throw result;
        } catch (err) {
            if (err instanceof Err) {
                result = err;
            } else {
                throw err;
            }
        }

        expect(result.val).toStrictEqual({
            message: "Algum erro ocorreu na escrita de um arquivo!",
            type: "unknown",
            obj: new Error("EACCES"),
        });

        fsMock.verify();
    });
});
//#endregion

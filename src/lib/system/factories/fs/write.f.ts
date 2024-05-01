/** @format */
//#region           External Libs
import fs from "fs/promises";
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import { Err, ErrorKind, ErrorOrigin } from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export interface Functions {
        /**
         * Write a JSON file.
         * @param path Path of the JSON file.
         * @param data Data to be written.
         */
        JSON: (path: string, data: object | string) => Promise<Ok<void>>;
    }
}
//#endregion
//#region           Implementation
const Default: Factory<types.Functions> = () => {
    const factory: FactoryObj<types.Functions> = {
        JSON: async (path, data) => {
            try {
                if (typeof data === "string") await fs.writeFile(path, data);
                else await fs.writeFile(path, JSON.stringify(data));

                return Ok.EMPTY;
            } catch (err: unknown) {
                const defaultMessage =
                    "Algum erro ocorreu na escrita de um arquivo!";

                throw new Err({
                    message: defaultMessage,
                    origin: ErrorOrigin.Unknown,
                    kind: ErrorKind.Other,
                    errObj: err,
                });
            }
        },
    };
    return factory;
};
export default Default();
//#endregion

/** @format */

//#region           External Libs
import fs from "fs/promises";
import path from "path";
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import verify from "@/system/factories/verify.f";
import { BotErr, ErrorKind, ErrorOrigin } from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export interface Functions {
        /**
         * Returns the content of a JSON file.
         *
         * *If the .json file exists and is empty, an error will be thrown.*
         * @param path The path of the .json file.
         */
        JSON: <T = UnknownObj>(path: string) => Promise<Ok<T>>;
        /**
         * Access a value from a object with a string path.
         * @param path String path.
         * @param obj The object.
         */
        accessPathInObj: (path: string, obj: AnyObj) => Ok<unknown>;
        /**
         * Find a file into a folder and returne its absolute path.
         * @param folder Folder path
         * @param fileSubstring Name of the file to be found
         * @param readdirOptions Options for the readdir
         */
        findFilePath: (
            folder: string,
            fileName: string,
            readdirOptions?: {
                withFileTypes?: false;
                recursive?: boolean;
            }
        ) => Promise<Ok<string>>;
    }
}
//#endregion
//#region           Implementation
const Default: Factory<types.Functions> = () => {
    const factory: FactoryObj<types.Functions> = {
        JSON: async (path) => {
            // Only one .json is accepted
            if (path.endsWith(".json")) {
                const data: string = await fs.readFile(path, "utf-8");

                const file = (await verify.isJSON(path)).val;

                if (file) {
                    return Ok(JSON.parse(data));
                } else {
                    if (data === "") {
                        throw new BotErr({
                            message: "This JSON file is empty!",
                            origin: ErrorOrigin.Internal,
                            kind: ErrorKind.EmptyValue,
                        });
                    } else {
                        throw new BotErr({
                            message: "This is an invalid JSON!",
                            origin: ErrorOrigin.Internal,
                            kind: ErrorKind.InvalidValue,
                        });
                    }
                }
            } else {
                throw new BotErr({
                    message: "This is not a JSON file!",
                    origin: ErrorOrigin.Internal,
                    kind: ErrorKind.TypeError,
                });
            }
        },
        accessPathInObj: (path, obj) => {
            const parts = path.split(".");
            var value = obj;

            const arrayRegex = /\[(.*?)\]/;

            const notFoundValue =
                "You're trying to access a value that doesn't exist!";
            const syntaxErr = "You're not using the right syntax!";

            // Syntax verification
            const syntax = /^(?:\w+|\[\d+\])(?:\.\w+|\[\d+\])*$/;
            if (!syntax.test(path)) {
                throw new BotErr({
                    message: syntaxErr,
                    origin: ErrorOrigin.Internal,
                    kind: ErrorKind.SyntaxError,
                });
            }

            // Access values
            for (const part of parts) {
                const arrayMatches = arrayRegex.exec(part);

                if (arrayMatches) {
                    const noIndexPart = part.replace(arrayRegex, "");

                    const tryAccessArray = parseInt(arrayMatches[1]);

                    value = value[noIndexPart][tryAccessArray];

                    continue;
                }

                if (!(part in value)) {
                    throw new BotErr({
                        message: notFoundValue,
                        origin: ErrorOrigin.Internal,
                        kind: ErrorKind.NotFound,
                    });
                }

                value = value[part];
            }

            return Ok(value);
        },
        findFilePath: async (folder, fileName, readdirOptions?) => {
            const dirFiles = fs.readdir(folder, readdirOptions);

            for (const file of await dirFiles) {
                if (path.basename(file) === fileName) {
                    return new Ok(`${folder}/${file}`);
                }
            }

            throw new BotErr({
                message: `File "${fileName}" not found!`,
                origin: ErrorOrigin.Internal,
                kind: ErrorKind.NotFound,
            });
        },
    };
    return factory;
};
export default Default();

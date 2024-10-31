/** @format */
//#region           External Libs
import path from "path";
import { Ok } from "ts-results";
//#region           Modules
import interpreter from "@/system/factories/interpreter.f";
import { BotErr, ErrorOrigin, ErrorKind } from "@/system/handlers/errHandlers";
//#endregion
//#endregion
//#region           Typing
export namespace types {
    export interface Functions {
        /**
         * A Javascript Template Literal interpreter.
         *
         * *This is in the string factory, so you can receive
         * only the types: "string", "boolean", "number" and "bigint", as
         * these are the types that make sense to put in a string*
         * @param string The string to interpret.
         * @param data The data to use in the string.
         * @example
         * const string = "The string to ${action}!";
         * const action = "interpret";
         *
         * const interpretedString = string.varInterpreter(string, { action });
         * console.log(interpretedString.val);
         */
        varInterpreter: (string: string, data: UnknownObj) => Ok<string>;
        /**
         * Extract the filename from a path, without the extension.
         * @param string The path to extract the filename from.
         * @example
         * const string = "/path/to/file.txt";
         * const filename = string.extractFilename(string).val;
         * console.log(filename);
         * /// "file"
         */
        extractFilename: (string: string) => Ok<string>;
    }
}
//# endregion
//#region           Implementation
const Default: Factory<types.Functions> = () => {
    const factory: FactoryObj<types.Functions> = {
        varInterpreter: (string, data) => {
            const regex = /\$\{([^}]+)\}/g;
            const matches: [string, string][] = [];

            var match;
            while ((match = regex.exec(string)) !== null) {
                matches.push([match[0], match[1]]);
            }

            var finalString = string;

            for (const [match, variable] of matches) {
                let value: unknown;
                let finalValue = "";

                var parts: string[] = variable.split(".");

                if (parts.length === 0) {
                    throw new BotErr({
                        message: "Uh... You need to specify a variable...",
                        origin: ErrorOrigin.Internal,
                        kind: ErrorKind.EmptyValue,
                    });
                } else {
                    for (let i = 0; i <= parts.length - 1; i++) {
                        let skip;
                        if (i === 0) {
                            value = interpreter.accessStringable(
                                data,
                                parts[i]
                            ).val;
                            skip = true;
                        }

                        if (i === parts.length - 1) {
                            let result;
                            if (i === 0) {
                                result = value;
                            } else {
                                result = interpreter.accessStringable(
                                    value,
                                    parts[i]
                                ).val;
                            }

                            if (typeof result === "object") {
                                if (Array.isArray(result)) {
                                    finalValue = result.join(", ");
                                } else {
                                    throw new BotErr({
                                        message:
                                            "The final value is an object!",
                                        origin: ErrorOrigin.Internal,
                                        kind: ErrorKind.TypeError,
                                    });
                                }
                            } else {
                                if (result !== undefined)
                                    finalValue = result.toString();
                                else
                                    throw new BotErr({
                                        message:
                                            "The final value is undefined!",
                                        origin: ErrorOrigin.Internal,
                                        kind: ErrorKind.NullishValue,
                                    });
                            }
                        } else {
                            if (skip) continue;

                            value = interpreter.accessStringable(
                                value,
                                parts[i]
                            ).val;
                        }

                        skip = false;
                    }
                }

                if (finalValue === "")
                    throw new BotErr({
                        message:
                            "Something is wrong! The final value is empty!",
                        origin: ErrorOrigin.Internal,
                        kind: ErrorKind.EmptyValue,
                    });

                finalString = finalString.replace(match, finalValue);
            }

            return Ok(finalString);
        },
        extractFilename: (string) => {
            string = path.basename(string);
            string = string.replace(`${path.extname(string)}`, "");

            return Ok(string);
        },
    };
    return factory;
};
export default Default();
//#endregion

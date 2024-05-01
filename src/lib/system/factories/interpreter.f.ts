/** @format */
//#region           External Libs
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import { Err, ErrorKind, ErrorOrigin } from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export type StringableFinalValue = string | boolean | number | bigint;
    export type Functions = {
        /**
         * Access a value that can be transformed
         * into a readable string.
         *
         * + If the result value is an object or an array, it will return it.
         * So you can use it into a loop for ensure a stringable value.
         * + If the result is an array, it will join the values with a comma.
         * @param value Object to try to access.
         * @param receivedKey Key to be used to access the value.
         * @since v0.3.0
         */
        accessStringable: (
            value: unknown,
            receivedKey: string
        ) => Ok<StringableFinalValue | StringableFinalValue[]>;
    };
}
//#endregion
//#region           Implementation
const Default: Factory<types.Functions> = () => {
    const factory: FactoryObj<types.Functions> = {
        accessStringable: (receivedValue, receivedKey) => {
            var finalValue;

            if (
                typeof receivedValue === "string" ||
                typeof receivedValue === "number" ||
                typeof receivedValue === "bigint" ||
                typeof receivedValue === "boolean"
            ) {
                finalValue = receivedValue;
            } else {
                if (typeof receivedValue === "object") {
                    if (!receivedValue) {
                        throw new Err({
                            message: `The part ${receivedKey} is null or undefined!`,
                            origin: ErrorOrigin.Internal,
                            kind: ErrorKind.NullishValue,
                        });
                    } else if (Object.keys(receivedValue).length === 0) {
                        throw new Err({
                            message: `The part ${receivedKey} is empty!`,
                            origin: ErrorOrigin.Internal,
                            kind: ErrorKind.EmptyValue,
                        });
                    } else if (Array.isArray(receivedValue)) {
                        if (typeof receivedKey === "number") {
                            finalValue = receivedValue[receivedKey];
                        } else if (receivedKey === "length") {
                            finalValue = receivedValue.length;
                        } else {
                            throw new Err({
                                message:
                                    `Type of the part "${receivedKey}" ` +
                                    "is not valid for accessing an array!",
                                origin: ErrorOrigin.Internal,
                                kind: ErrorKind.TypeError,
                            });
                        }
                    } else {
                        const findValue = Object.entries(receivedValue).find(
                            (entry) => entry[0] === receivedKey
                        );
                        if (!findValue) {
                            throw new Err({
                                message: `The part ${receivedKey} doesn't exist!`,
                                origin: ErrorOrigin.Internal,
                                kind: ErrorKind.NotFound,
                            });
                        }

                        {
                            const value = findValue[1];

                            finalValue = value;
                        }
                    }
                } else {
                    throw new Err({
                        message:
                            "You're trying to access a" +
                            "value that is not an object!",
                        origin: ErrorOrigin.Internal,
                        kind: ErrorKind.TypeError,
                    });
                }
            }

            return Ok(finalValue);
        },
    };
    return factory;
};
export default Default();
//#endregion

/** @format */
//#region           External Libs
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import {
    Result,
    ErrorKind,
    ErrorOrigin,
    BotErr,
} from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export interface Functions {
        /**
         * A parser to convert a string with date limit
         * to a number of milliseconds.
         *
         * @param limit The limit to parse. Possible values are:
         * "s" (second), "min" (minute), "h" (hour), "d" (day),
         * "w" (week), "m" (month), "y" (year).
         * The possible operators are "+" and "-".
         *
         * Values as "tomorrow",
         * "mon" (Monday), "sun" (Sunday) aren't yet implemented.
         * @example
         * const now = new Date();
         * const limit = "3h+40min";
         *
         * const parsedLimit = parse.limitToMili(limit).unwrap();
         *
         * const finalDate = new Date(now + parsedLimit);
         */
        limitToMili: (limit: string) => Result<number>;
    }
}
//# endregion
//#region           Implementation
const Default: Factory<types.Functions> = () => {
    const factory: FactoryObj<types.Functions> = {
        limitToMili: (limit: string) => {
            const wrongFormatErr = {
                message:
                    "Ei! Você entregou o parâmetro limit com um formato errado!",
                origin: ErrorOrigin.User,
                kind: ErrorKind.SyntaxError,
            };

            const unitsMilisseconds: Record<string, number> = {
                s: 1000,
                min: 1000 * 60,
                h: 1000 * 60 * 60,
                d: 1000 * 60 * 60 * 24,
                w: 1000 * 60 * 60 * 24 * 7,
                m: 1000 * 60 * 60 * 24 * 30,
                y: 1000 * 60 * 60 * 24 * 365,
            };
            const operators = { plus: "+", minus: "-" };
            let divisorsString = "([";
            {
                for (const [, value] of Object.entries(operators)) {
                    divisorsString += `\\${value}`;
                }

                divisorsString += "])";
            }

            const unitsRegex = /(s|min|h|d|w|m|y)/;
            const numbersRegex = /(\d+)/;
            const divisorsRegex = new RegExp(divisorsString, "g");

            let finalLimit = 0;
            {
                limit = limit.replace(/\s/g, "");

                const operations = [];
                const limitParts = limit.split(divisorsRegex);

                for (const limitPart of limitParts) {
                    if (Object.values(operators).includes(limitPart)) {
                        if (operations.length === 0 && limitPart === "+")
                            continue;

                        operations.push(limitPart);
                    } else {
                        const unitParts = limitPart.match(
                            new RegExp(numbersRegex.source + unitsRegex.source)
                        );

                        if (unitParts === null) return new BotErr(wrongFormatErr);

                        if (limitPart.replace(unitParts[0], "") !== "")
                            return new BotErr(wrongFormatErr);

                        const unitNumber = parseInt(unitParts[1], 10);
                        const unitMili = unitsMilisseconds[unitParts[2]];
                        operations.push((unitNumber * unitMili).toString());
                    }
                }

                let lastOperator = operators.plus;
                for (const operationPart of operations) {
                    if (Object.values(operators).includes(operationPart)) {
                        lastOperator = operationPart;
                    } else {
                        const parsedNumber = parseInt(operationPart, 10);

                        if (lastOperator === operators.plus) {
                            finalLimit += parsedNumber;
                        } else {
                            finalLimit += -parsedNumber;
                        }
                    }
                }
            }
            return Ok(finalLimit);
        },
    };
    return factory;
};
export default Default();
//#endregion

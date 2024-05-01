/** @format */
//#region           External Libs
import anchorme from "anchorme";
import { Ok } from "ts-results";
//#endregion
//#region           Typing
import { ListingProps } from "anchorme/dist/node/types";
export namespace types {
    export type LinkFilterConfigs = {
        type: "exclusion" | "inclusion";
        links: string[];
    };

    export interface Utils {
        receiveMatches: (string: string) => Ok<ListingProps[]>;
    }
    export interface ComplexFilters {
        Link: (content: string, configs: LinkFilterConfigs) => Ok<boolean>;
    }
}
//#region           Implementation
export class StringChecker {
    static Utils(): FactoryObj<types.Utils> {
        const factory: FactoryObj<types.Utils> = {
            receiveMatches: (string: string) => {
                const matches = anchorme.list(string);
                const filteredMatches: ListingProps[] = [];

                for (const match of matches) {
                    if (anchorme.validate.url(match.string))
                        filteredMatches.push(match);
                }

                return Ok(filteredMatches);
            },
        };
        return factory;
    }
    static ComplexFilters(): FactoryObj<types.ComplexFilters> {
        const factory: FactoryObj<types.ComplexFilters> = {
            Link: (string, configs) => {
                const matches = StringChecker.Utils().receiveMatches(string);

                for (const match of matches) {
                    const condition = configs.links.includes(match.string);

                    if (configs.type === "exclusion") {
                        // Allow all and exclude links
                        if (condition) return Ok(true);
                    } else {
                        // Exclude all and allow links
                        if (!condition) return Ok(true);
                    }
                }

                return Ok(false);
            },
        };
        return factory;
    }
}
export default StringChecker;
//#endregion

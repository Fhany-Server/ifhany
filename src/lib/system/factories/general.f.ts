/** @format */
//#region           External Libs
import { Ok } from "ts-results";
import {
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    Partials,
} from "discord.js";
//#endregion
//#region           Modules
import { Log } from "@/system/handlers/log";
//#endregion
//#region           Typing
import { types as commsTypes } from "@/system/handlers/command";
export namespace types {
    export interface MyClient extends Client {
        commands: commsTypes.CommsCollection;
        pairsOfListeners: {
            [key: string]: {
                function: AnyFunction;
                params?: UnknownObj;
            };
        };
    }

    export interface General {
        createClient: (params: {
            token: string;
            version: string;
        }) => Ok<MyClient>;
    }
}
//#endregion
//#region           Implementation
const Default: Factory<types.General> = () => {
    const factory: FactoryObj<types.General> = {
        createClient: (params) => {
            const client = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.GuildMessageReactions,
                    GatewayIntentBits.GuildEmojisAndStickers,
                    GatewayIntentBits.MessageContent,
                    GatewayIntentBits.DirectMessages,
                    GatewayIntentBits.DirectMessageReactions,
                ],
                partials: [Partials.Reaction, Partials.Message],
            }) as types.MyClient;
            client.commands = new Collection();
            client.pairsOfListeners = {};

            client.once(Events.ClientReady, (c) => {
                new Log("success.client").Print({
                    name: c.user.tag,
                    version: params.version,
                });
            });

            //! It's a Promise! You need to transform it
            //! to an async function later!
            client.login(params.token);

            return Ok(client);
        },
    };

    return factory;
};
export default Default();
//#endregion

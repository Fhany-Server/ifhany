/** @format */

//#region           External Libs
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import { Log } from "@/system/handlers/log";
import { BotErr, ErrorKind, ErrorOrigin } from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export interface PredefinedListeners {
        /**
         * Listen for uncaught exceptions.
         */
        uncaughtExceptions: () => Ok<void>;
    }
}
//#endregion
//#region           Variables
const nonInitializedErr = new BotErr({
    message: "Listener are not initialized!",
    origin: ErrorOrigin.Unknown,
    kind: ErrorKind.Other,
});
//#endregion
//#region           Implementation
const Default: Factory<types.PredefinedListeners> = () => {
    const listeners: FactoryObj<types.PredefinedListeners> = {
        uncaughtExceptions: () => {
            const signal = "uncaughtException";
            const currentListeners = process.listeners(signal);

            process.on(signal, (err) => {
                Log.PrintErr(err);
            });

            if (currentListeners === process.listeners(signal))
                throw nonInitializedErr;

            return Ok.EMPTY;
        },
    };

    return listeners;
};
export default Default();
//#endregion

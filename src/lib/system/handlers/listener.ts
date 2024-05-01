/** @format */

//#region           External Libs
import { Ok } from "ts-results";
import { ClientEvents } from "discord.js";
//#endregion

//#region           Modules
import listeners from "@/system/factories/listeners.f";
import { Log } from "@/system/handlers/log";
import { client } from "//index";
//#endregion

//#region           Implementation
/**
 * Handler of Listeners.
 * @since v0.1.0
 */
export class ListenerHandler {
    event: keyof ClientEvents;
    name: string;

    constructor(event: keyof ClientEvents, name: string) {
        this.event = event;
        this.name = name;
    }
    /**
     * Load Predefined Listeners.
     * @param listeners The factory object.
     */
    public static PredefinedListeners(): Ok<void> {
        for (const key in listeners) {
            if (
                typeof listeners[key as keyof typeof listeners] === "function"
            ) {
                (listeners[key as keyof typeof listeners] as AnyFunction)();
            }

            new Log("espec.listeners.listenerLoaded").Print({ name: key });
        }

        return Ok.EMPTY;
    }
    /**
     * Create a new listener.
     * @param callback The callback function.
     * @example
     * const listener = new ListenerHandler("messageCreate", "test");
     *
     * listener.New((message) => {
     *     console.log(message.content);
     * })
     */
    public NewOn(callback: AnyFunction): Ok<void> {
        client.on(this.event, callback);

        client.pairsOfListeners[this.name] = {
            function: callback,
        };

        new Log("espec.listeners.listenerLoaded").Print({ name: this.name });

        return Ok.EMPTY;
    }
    /**
     * Create a new listener that will be called only once.
     * @param callback The callback function.
     * @example
     * const listener = new ListenerHandler("messageCreate", "test");
     *
     * listener.NewOnce((message) => {
     *     console.log("This will be called only once!");
     *     console.log(message.content);
     * })
     */
    public NewOnce(callback: AnyFunction): Ok<void> {
        client.once(this.event, callback);

        new Log("espec.listeners.onceListenerLoaded").Print({
            name: this.name,
        });

        return Ok.EMPTY;
    }
    /**
     * Remove a existing listener.
     *
     * *This will remove the listener based on its name.*
     */
    public Remove(): Ok<void> {
        const listener = client.pairsOfListeners[this.name].function;

        client.removeListener(this.event, listener);

        delete client.pairsOfListeners[this.name];

        return Ok.EMPTY;
    }
}
//#endregion
/** @format */

//#region           External Libs
import NodeCache from "node-cache";
import { Ok } from "ts-results";
import { EventEmitter } from "events";
//#endregion
//#region           Modules
import { BotErr, ErrorOrigin, ErrorKind } from "@/system/handlers/errHandlers";
//#endregion
//#region           Implementation
export class CacheHandler extends NodeCache {
    emitter: EventEmitter;

    constructor(options?: UnknownObj) {
        super(options);
        this.emitter = new EventEmitter();
    }

    public Set(key: string, value: unknown, ttl?: string): Ok<void> {
        var result;

        // Set TTL
        if (ttl) {
            result = super.set(key, value, ttl);
        } else {
            result = super.set(key, value);
        }

        // Verify Errors
        if (!result)
            throw new BotErr({
                message: "Unable to create cache entry!",
                origin: ErrorOrigin.Internal,
                kind: ErrorKind.Other,
            });

        this.emitter.emit("valueChanged", key, value);

        return Ok.EMPTY;
    }

    public onceValueChanged(
        listener: (...args: unknown[]) => void
    ): Ok<EventEmitter> {
        return Ok(this.emitter.once("valueChanged", listener));
    }

    public cleanEntry(key: string | string[]): Ok<number> {
        const deletedEntries = super.del(key);

        return Ok(deletedEntries);
    }
}
//#endregion

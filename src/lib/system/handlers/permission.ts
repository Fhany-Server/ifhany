/** @format */

//#region           External Libs
import path from "path";
import lockfile from "proper-lockfile";
import { Ok } from "ts-results";
import { Snowflake } from "discord.js";
//#endregion
//#region           Modules
import write from "@/system/factories/fs/write.f";
import read from "@/system/factories/fs/read.f";
import { Log } from "@/system/handlers/log";
import { Err, ErrorOrigin, ErrorKind } from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export interface CommandPermissions {
        roles: {
            /**
             * If it's public, everyone can use it.
             * If it's private, only administrators can use it.
             */
            allowed: "public" | "private" | Snowflake[];
            /**
             * Bitfield of who can use it.
             */
            minViewer: "public" | "private" | Snowflake;
        };
    }
    export interface GuildObject {
        /**
         * Name of the guild.
         */
        name: string;
        /**
         * Permissions separated by commands.
         */
        commands: { [commandName: string]: CommandPermissions };
    }

    export interface SettingsFile {
        [guild: Snowflake]: GuildObject;
    }
}
//#endregion
//#region           Variables
import { client, guild } from "//index";
//#endregion
//#region           Implementation
export class PermissionsHandler {
    private _configs: types.SettingsFile;

    protected readonly _configs_dir: string;

    constructor() {
        this._configs = {};
        this._configs_dir = path.resolve(
            __dirname,
            "../../../../data/default/permissions.json"
        );
    }
    //#region           Data Manipulation
    /**
     * Get the permissions data and put it in `this._configs`.
     *
     * This function returns a release function.
     */
    private async GetPermissionsData(): Promise<Ok<AsyncAnyFunction>> {
        var release = await lockfile.lock(this._configs_dir, {
            retries: {
                retries: 5,
                minTimeout: 100,
                maxTimeout: 1000,
            },
        });

        const data = (await read.JSON(this._configs_dir)).val;

        this._configs = data as types.SettingsFile;

        return Ok(release);
    }
    /**
     * Write the current data in `this._configs` to the disk.
     * @param release The function that releases the lock.
     * @example
     * const release = (await this.GetPermissionsData()).val;
     *
     * await this.WritePermissionsData(release);
     * // This will write the data to the disk and release the lock.
     */
    private async WritePermissionsData(
        release: AsyncAnyFunction
    ): Promise<Ok<void>> {
        await write.JSON(this._configs_dir, this._configs);

        await release();

        return Ok.EMPTY;
    }
    //#endregion
    //#region           Getters
    /**
     * Check the visibility bitfield based on the roles.
     * @param commandName The name of the command.
     * @returns The bigint permission bitfield.
     */
    public async MinViewers(commandName: string): Promise<Ok<bigint>> {
        const release = (await this.GetPermissionsData()).val;

        const command = this._configs[guild].commands[commandName];

        // Check general states
        {
            var minViewer = command.roles.minViewer;

            if (minViewer === "public") return Ok(0n);
            else if (minViewer === "private") return Ok(8n);
        }

        const gld = await client.guilds.fetch(guild);
        const rolePermissions = await gld.roles.fetch(minViewer);

        if (!rolePermissions)
            throw new Err({
                message: `The role with the id: ${minViewer} was not found!`,
                origin: ErrorOrigin.Internal,
                kind: ErrorKind.NotFound,
            });

        const bitFieldPerms = rolePermissions.permissions.bitfield;

        await release();

        return Ok(bitFieldPerms);
    }
    /**
     * Check which roles are allowed to use the command.
     * @param commandName The name of the command.
     * @returns
     * Return a `string` if a specific role was found.
     * Return a `boolean` if the command is
     * public (true) or private (false).
     */
    public async AllowedRoles(
        commandName: string
    ): Promise<Ok<string[] | boolean>> {
        const release = (await this.GetPermissionsData()).val;
        await release();

        const commandPermissions = this._configs[guild].commands[commandName];
        const allowed = commandPermissions.roles.allowed;

        const gld = await client.guilds.fetch(guild);
        if (!gld)
            throw new Err({
                message: `The guild with the id: ${guild} was not found!`,
                origin: ErrorOrigin.Internal,
                kind: ErrorKind.NotFound,
            });

        if (typeof allowed === "string") {
            if (allowed === "public") return Ok(true);
            else if (allowed === "private") return Ok(false);
            else {
                throw new Err({
                    message: "The allowed property of the command is invalid!",
                    origin: ErrorOrigin.Internal,
                    kind: ErrorKind.InvalidValue,
                });
            }
        } else if (Array.isArray(allowed)) {
            var roles = [];
            for (let i = 0; i <= allowed.length; i++) {
                const roleObj = await gld.roles.fetch(allowed[i]);

                if (roleObj !== null) {
                    roles.push(allowed[i]);
                } else {
                    const message = `The role with the id: ${allowed[i]} was not found!`;

                    Log.PrintErr(
                        new Err({
                            message,
                            origin: ErrorOrigin.Internal,
                            kind: ErrorKind.NotFound,
                        })
                    );
                }
            }

            return new Ok(roles);
        } else {
            throw new Err({
                message:
                    "The allowed property of the command is not a string or an array!",
                origin: ErrorOrigin.Internal,
                kind: ErrorKind.TypeError,
            });
        }
    }
    //#endregion
    //#region           Setters
    /**
     * This will ensure that the permissions file has all the
     * commands, if not, it will add them with a empty
     * configuration. (allowed: private, minViewer: private)
     */
    public async EnsureCommandsPermissions(): Promise<Ok<void>> {
        const release = (await this.GetPermissionsData()).val;

        var configuredCommands = [];

        for (const entry in this._configs[guild].commands) {
            configuredCommands.push(entry);
        }
        for (const [key] of client.commands) {
            if (!configuredCommands.includes(key)) {
                this._configs[guild].commands[key] = {
                    roles: {
                        allowed: "private",
                        minViewer: "private",
                    },
                };
            }
        }

        await this.WritePermissionsData(release);

        return Ok.EMPTY;
    }
    //#endregion
}
//#endregion

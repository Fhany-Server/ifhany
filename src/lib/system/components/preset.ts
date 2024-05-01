/** @format */
//#region           External
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import lockfile from "proper-lockfile";
import { Ok } from "ts-results";
import { Collection } from "discord.js";
//#endregion
//#region           Modules
import read from "@/system/factories/fs/read.f";
import write from "@/system/factories/fs/write.f";
import string from "@/system/factories/string.f";
import verify from "@/system/factories/verify.f";
import { Err, ErrorOrigin, ErrorKind } from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
export namespace types {
    export type Preset = { data: UnknownObj; name: string };
    export type Presets = Collection<string, Preset>;
    export type PresetsObject = { [key: string]: Preset };

    export type PresetInfo = { uuid: string; name: string };
    export type PresetObject = { uuid: string; object: Preset };

    export type PresetVerify =
        | {
              exists: true;
              uuid: string;
          }
        | {
              exists: false;
          };

    export interface VerifyFunctions {
        /**
         * Check whether a preset file exists for the specified command.
         */
        commandPreset: () => Promise<Ok<boolean>>;
        /**
         * Check wheter a preset exists on the command preset file.
         * @param presetName Name of preset.
         */
        preset: (presetName: string) => Promise<Ok<PresetVerify>>;
        /**
         * Check the integrity of the preset file.
         * @param commandPreset
         */
        checkPresetFileIntegrity: (
            commandPreset: UnknownObj
        ) => Ok<types.Presets>;
    }

    export interface UtilsFunctions {
        /*
         * Returns the relative path resulting from the
         * preset added to the base directory.
         * @param receivedPath Relative path.
         */
        resolvePath: (receivedPath: string) => Ok<string>;
        /**
         * Creates the SHA-1 hash that serves as the UUID of the preset.
         * @param data Preset data.
         * @returns Unic SHA-1 hash.
         */
        createPresetHash: (data: UnknownObj) => Ok<string>;
        /**
         * Access a preset by its name.
         * @param presetID ID of the preset.
         * @param searchBy What to use to find the preset.
         * @returns Data of preset
         */
        accessPreset: (
            presetID: string,
            searchBy?: "name" | "uuid"
        ) => Promise<Ok<types.PresetObject>>;
        /**
         * Executes a function in a preset.
         * @param name Name of preset.
         * @param callback Function to be executed.
         * @example
         * // deleting a preset
         * const presetName = "myPreset";
         * const release = await this.actionByPreset(
         *      presetName,
         *      (preset) => {
         *          delete preset.data;
         * });
         */
        actionByPreset: (
            name: string,
            callback: (preset: types.PresetObject) => void
        ) => Promise<Ok<void>>;
        /**
         * Returns a preset data directly from a loaded on "this" preset.
         */
        getData: (root: UnknownObj, property?: string) => Promise<Ok<unknown>>;
        /**
         * Create a new preset.
         * @param uuid The UUID (hash) to be associated with the new preset.
         * @param presetName The name of the new preset.
         * @param data The data of the new preset.
         */
        createPreset: (
            uuid: string,
            presetName: string,
            data?: UnknownObj
        ) => Promise<Ok<types.PresetObject>>;
        /**
         * Mount presets JSON.
         */
        mountPresetsJSON: () => Promise<Ok<void>>;
    }

    export namespace Options {
        export interface Get {
            /**
             * The search method.
             * @default "name"
             */
            searchBy: "name" | "uuid";
        }
    }
}
//#endregion
//#region           Variables
const baseCommandsDir = path.join(__dirname, "../../../../src/commands");
//#endregion
//#region           Implementation
/**
 * Preset structure. Base of PresetHandler and DataBowlHandler.
 * @param commandPreset Name of the command of the preset.
 * @param basePresetDir Base preset directory.
 * @since v0.3.0
 */
export class Preset {
    /**
     * Name of the manipulated preset.
     *
     * **It can be "none", but only in an instance
     * that will only use EnsureDataExistence().**
     */
    command_preset_name: string;

    protected _command_preset_collection: types.Presets;
    protected _command_preset_json: types.PresetsObject;
    protected readonly _preset_dir: string;
    protected readonly _base_preset_dir: string;

    constructor(commandPreset: string, basePresetDir: string) {
        this.command_preset_name = commandPreset;
        this._base_preset_dir = basePresetDir;
        this._preset_dir = this.Utils().resolvePath(
            this.command_preset_name
        ).val;

        this._command_preset_collection = new Collection();
        this._command_preset_json = {};
    }

    //#region           Built-in Utilities
    protected Utils(): types.UtilsFunctions {
        const factory: FactoryObj<types.UtilsFunctions> = {
            resolvePath: (receivedPath) => {
                return Ok(
                    path.resolve(this._base_preset_dir, `${receivedPath}.json`)
                );
            },
            createPresetHash: (data) => {
                const dataString = JSON.stringify(data);
                const hash = crypto
                    .createHash("sha-1")
                    .update(dataString)
                    .digest("hex");

                return Ok(hash);
            },
            accessPreset: async (
                presetID: string,
                searchBy?: "name" | "uuid"
            ) => {
                const notFoundMessage =
                    "O preset com o identificador " +
                    `"**${presetID}**" não existe!`;

                if (searchBy === "uuid") {
                    const preset =
                        this._command_preset_collection.get(presetID);
                    if (preset)
                        return Ok({
                            uuid: presetID,
                            object: preset,
                        });
                } else {
                    for (const [
                        presetUUID,
                    ] of this._command_preset_collection.entries()) {
                        const preset =
                            this._command_preset_collection.get(presetUUID);

                        if (preset && preset.name === presetID) {
                            return Ok({
                                uuid: presetUUID,
                                object: preset,
                            });
                        }
                    }
                }

                throw new Err({
                    message: notFoundMessage,
                    origin: ErrorOrigin.User,
                    kind: ErrorKind.NotFound,
                });
            },
            actionByPreset: async (name, callback) => {
                const release = (await this.GetPresetData()).val;

                try {
                    const preset = await this.Utils().accessPreset(name);

                    callback(preset.val);
                    await this.WritePresetData(release);
                } catch (err) {
                    release();

                    throw err;
                }

                return Ok.EMPTY;
            },
            getData: async (root, property?) => {
                if (!property) return Ok(root);

                if (root[property]) return Ok(root[property]);
                else return Ok(null);
            },
            createPreset: async (uuid, presetName, data?) => {
                const release = (await this.GetPresetData()).val;

                // Criação do Preset
                if ((await this.Verify().preset(presetName)).val.exists) {
                    await release();

                    throw new Err({
                        message: `O preset **${presetName}** já existe!`,
                        origin: ErrorOrigin.User,
                        kind: ErrorKind.AlreadyExists
                    });
                } else {
                    var presetData = {
                        data: data ? data : {},
                        name: presetName,
                    };

                    this._command_preset_collection.set(uuid, presetData);
                }

                await this.WritePresetData(release);

                return Ok({
                    uuid,
                    object: presetData,
                });
            },
            mountPresetsJSON: async () => {
                this._command_preset_json = {};

                this._command_preset_collection.each((value, key) => {
                    this._command_preset_json[key] = value;
                });

                return new Ok(void 0);
            },
        };

        return factory;
    }
    protected Verify(): types.VerifyFunctions {
        const factory: FactoryObj<types.VerifyFunctions> = {
            commandPreset: async () => {
                return await verify.exists(this._preset_dir);
            },
            preset: async (presetName) => {
                for (const [uuid, preset] of this._command_preset_collection) {
                    if (preset.name === presetName)
                        return new Ok({ exists: true, uuid });
                }

                return Ok({ exists: false });
            },
            checkPresetFileIntegrity: (commandPreset) => {
                const finalCommandPreset: types.Presets = new Collection();

                for (const key in commandPreset) {
                    const error = new Err({
                        message: "This preset file is corrupted!",
                        origin: ErrorOrigin.Internal,
                        kind: ErrorKind.CorruptedFile,
                    });
                    const preset = commandPreset[key];

                    // Check key type
                    if (!(typeof key === "string")) throw error;
                    // Ensure that the preset is an object
                    if (!preset || !(typeof preset === "object")) throw error;

                    // Check preset properties existence
                    if (!("name" in preset) || !("data" in preset)) throw error;
                    // Check preset properties types
                    if (
                        !(typeof preset.data === "object") ||
                        !(typeof preset.name === "string")
                    )
                        throw error;

                    finalCommandPreset.set(key, preset as types.Preset); //! DEV
                }

                return Ok(finalCommandPreset);
            },
        };
        return factory;
    }
    //#endregion

    //#region           Data Manipulation
    /**
     * Update `this._command_preset` object with the current preset data.
     * This will read the real-time data on the disk.
     * @returns It will return a release function.
     * @example
     * const release = await this.GetPresetData();
     * /// Do something
     * await release(); // release db
     */
    protected async GetPresetData(): Promise<Ok<AsyncAnyFunction>> {
        var release = await lockfile.lock(this._preset_dir, {
            retries: {
                retries: 5,
                minTimeout: 100,
                maxTimeout: 1000,
            },
        });

        const data = (await read.JSON(this._preset_dir)).val;

        this._command_preset_collection =
            this.Verify().checkPresetFileIntegrity(data).val;

        return Ok(release);
    }
    /**
     * Write `this._command_preset` object to the disk.
     *
     * **Obvious observation**: *This is only useful if you already
     * written to the object `this._command_preset`,
     * after all, how do you want to update the data?*
     * @param release
     * @since v0.3.0
     * @example
     * /// [...]
     * const release = await this.GetPresetData();
     *
     * this._command_preset = this._command_preset[myPresetUUID] = myNewPreset;
     *
     * await this.WritePresetData(release);
     */
    protected async WritePresetData(release: AnyFunction): Promise<Ok<void>> {
        this.Utils().mountPresetsJSON();

        await write.JSON(this._preset_dir, this._command_preset_json);

        await release();

        return Ok.EMPTY;
    }
    /**
     * Ensure that database and all its files exists.
     *
     * *This is only useful in New method*
     * @since v0.3.0
     * @example
     * /// Here, I can't know if there is a preset file or not.
     * await EnsureDataExistence();
     * /// But here, I know
     */
    public async EnsureDataExistence(): Promise<Ok<void>> {
        // Create directory if it doesn't exist
        if (!(await verify.exists(this._base_preset_dir)).val) {
            await fsp.mkdir(this._base_preset_dir, { recursive: true });
        }

        // Check the preset directory and create preset files that do not exist
        {
            const presetDirFiles = await fsp.readdir(this._base_preset_dir);
            let commandsDirFiles = await fsp.readdir(baseCommandsDir, {
                recursive: true,
            });

            commandsDirFiles = commandsDirFiles.filter(
                (string) => !string.includes(".map")
            );

            for (let commandFile of commandsDirFiles) {
                if (
                    (
                        await fsp.stat(`${baseCommandsDir}/${commandFile}`)
                    ).isDirectory()
                )
                    continue;

                commandFile = string.extractFilename(commandFile).val;

                let commandHavePresetFile = false;

                for (let presetFile of presetDirFiles) {
                    presetFile = string.extractFilename(presetFile).val;

                    if (presetFile !== commandFile) continue;
                    else {
                        commandHavePresetFile = true;
                        break;
                    }
                }

                if (!commandHavePresetFile) {
                    write.JSON(
                        path.resolve(
                            this._base_preset_dir,
                            `${commandFile}.json`
                        ),
                        this._command_preset_json
                    );
                }
            }
        }

        return Ok.EMPTY;
    }
    //#endregion

    //#region           Preset Manipulation
    /**
     * Delete a preset.
     * @param name Preset name.
     */
    public async Remove(name: string): Promise<Ok<void>> {
        const result = this.Utils().actionByPreset(name, (preset) => {
            this._command_preset_collection.delete(preset.uuid);
        });

        return result;
    }
    /**
     * Rename the preset.
     * @param name Preset current name.
     * @param newName New name to be set.
     * @since v0.3.0
     */
    public async Rename(name: string, newName: string): Promise<Ok<void>> {
        const result = this.Utils().actionByPreset(name, (presetObject) => {
            var preset = presetObject.object;

            preset.name = newName;

            this._command_preset_collection.set(presetObject.uuid, preset);
        });

        return result;
    }
    /**
     * Add a new property to the preset data.
     * If the property already exists, it will throw an error.
     * @param name Preset name.
     * @param data New property data.
     * @param propertyName Name of the new property.
     * @since v0.3.0
     * @example
     * const data = {
     *      myBoolean: true,
     *      myNumber: 123
     * };
     * const name = "myPreset";
     *
     * console.log(this._command_preset);
     * /// "uuid": {
     * ///      data: { myString: "is this a string???", number: 3 },
     * ///      name: "myPreset"
     * /// }
     * await handler.Set("myPreset", newData, "object");
     * console.log(this._command_preset);
     * /// "uuid": {
     * ///      data: {
     * ///          myString: "is this a string???",
     * ///          number: 3,
     * ///          object: { myBoolean: true, myNumber: 123 }
     * ///      },
     * ///      name: "myPreset"
     * /// }
     */
    public async Put(
        name: string,
        data: unknown,
        propertyName: string
    ): Promise<Ok<void>> {
        const result = this.Utils().actionByPreset(name, (presetObject) => {
            var preset = presetObject.object;

            if (preset.data[propertyName])
                throw new Err({
                    message: `Property ${propertyName} already exists!`,
                    origin: ErrorOrigin.Internal,
                    kind: ErrorKind.AlreadyExists,
                });

            preset.data[propertyName] = data;

            this._command_preset_collection.set(presetObject.uuid, preset);
        });

        return result;
    }
    /**
     * **OVERWRITE METHOD** - Overwrite a preset property if it exists.
     * If not, it will throw an error.
     * @param name Preset name.
     * @param newData New property data.
     * @param propertyName Name of property to be modified in data object.
     * @since v0.3.0
     * @example
     * const newData = {
     *      myBoolean: true,
     *      myNumber: 123
     * };
     * const name = "myPreset";
     *
     * console.log(this._command_preset);
     * /// "uuid": {
     * ///      data: { object: "is this a string???", number: 3 },
     * ///      name: "myPreset"
     * /// }
     * await handler.Set(name, newData, "object");
     * console.log(this._command_preset);
     * /// "uuid": {
     * ///      data: { object: { myBoolean: true, myNumber: 123 }, number: 3 },
     * ///      name: "myPreset"
     * /// }
     */
    public async Set(
        name: string,
        newData: unknown,
        propertyName: string
    ): Promise<Ok<void>> {
        await this.Utils().actionByPreset(name, (presetObject) => {
            var preset = presetObject.object;

            if (!preset.data[propertyName])
                throw new Err({
                    message:
                        `Property "${propertyName}" not found in preset "${name}".` +
                        "It's impossible to overwrite a property that doesn't exist!",
                    origin: ErrorOrigin.Internal,
                    kind: ErrorKind.NotFound,
                });

            preset.data[propertyName] = newData;

            this._command_preset_collection.set(presetObject.uuid, preset);
        });

        return Ok.EMPTY;
    }
    /**
     * **OVERWRITE METHOD** - Overwrite all preset data.
     *
     * *This is for a specific use, don't use frequently.*
     * @param name Preset name.
     * @param newData Nem entire preset data.
     * @example
     * const newData = {
     *      myBoolean: true,
     *      myNumber: 123
     * };
     * const name = "myPreset";
     *
     * console.log(this._command_preset);
     * /// "uuid": {
     * ///      data: { object: "this is a string???", number: 3 },
     * ///      name: "myPreset"
     * /// }
     * await handler.SetAllData(name, newData);
     * console.log(this._command_preset);
     * /// "uuid": {
     * ///      data: { myBoolean: true, myNumber: 123 },
     * ///      name: "myPreset"
     * /// }
     */
    public async SetAllData(
        name: string,
        newData: UnknownObj
    ): Promise<Ok<void>> {
        await this.Utils().actionByPreset(name, (presetObject) => {
            var preset = presetObject.object;

            preset.data = newData;

            this._command_preset_collection.set(presetObject.uuid, preset);
        });

        return Ok.EMPTY;
    }
    /**
     * Returns the preset data.
     * @param name Preset name.
     * @since v0.3.0
     */
    public async Get(
        presetName: string,
        options?: types.Options.Get
    ): Promise<Ok<types.PresetObject>> {
        const release = (await this.GetPresetData()).val;

        try {
            if (options) {
                var preset = await this.Utils().accessPreset(
                    presetName,
                    options.searchBy
                );
            } else {
                var preset = await this.Utils().accessPreset(presetName);
            }

            return new Ok(preset.val);
        } finally {
            await release();
        }
    }
    /**
     * List all presets.
     * @since v0.3.0
     */
    public async List(): Promise<Ok<types.PresetInfo[]>> {
        const release = (await this.GetPresetData()).val;

        const presets = [];

        for (const [uuid, value] of this._command_preset_collection.entries()) {
            presets.push({
                uuid,
                name: value.name,
            });
        }

        release();

        return Ok(presets);
    }
    //#endregion
}
//#endregion

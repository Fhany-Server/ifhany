/** @format */
// * External Libs
import path from "path";
import { Ok } from "ts-results";

// * Modules
import { Preset } from "@/system/components/preset";

// * Typing
import { types as presetTypes } from "@/system/components/preset";
import { PresetHandler } from "./presetHandler";

// * Variables
export const basePresetDir = path.join(
    __dirname,
    "../../../../data/presets/data"
);

/**
 * A data bowl for your presets.
 * This can be used to add things that you will use when
 * running the preset command, not to identify which preset
 * it is and what parameters it has (for this, use PresetHandler).
 * Separate data from preset information.
 */
export class DataBowlHandler extends Preset {
    constructor(presetCommand: string) {
        super(presetCommand, basePresetDir);
    }

    //#region           Preset Manipulation
    /**
     * Create a new data bowl to your preset.
     * @param uuid The uuid of the base preset.
     * @param data The data of the new preset
     * @returns Returns the hash and name of the new preset
     * @example
     * /// [...]
     * const newPresetName = "myPreset";
     * const presetData = {
     *       key1: "blah blah blah",
     * }
     *
     * const newPreset = await new PresetHandler(commandName)
     *      .New(newPresetName, presetData);
     * console.log(newPreset);
     * /// { hash: "myPreset-sha-1-hash", name: "myPreset" }
     */
    public async New(
        uuid: string,
        data: UnknownObj
    ): Promise<Ok<presetTypes.PresetInfo>> {
        await this.EnsureDataExistence();

        const name = (await new PresetHandler(this.command_preset_name).Get(uuid, {
            searchBy: "uuid"
        })).val.object.name;

        await this.Utils().createPreset(uuid, name, data);

        return Ok({
            uuid,
            name,
        });
    }
    //#endregion
}

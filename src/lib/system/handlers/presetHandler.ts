/**
 * @format
 */

// * Libs Externas
import path from "path";
import fsp from "fs/promises";
import { Ok } from "ts-results";

// * Módulos
import read from "@/system/factories/fs/read.f";
import string from "@/system/factories/string.f";
import { Preset } from "@/system/components/preset";

// * Tipagem
import { types as presetTypes } from "@/system/components/preset";

export namespace types {
    export type PresetInfo = presetTypes.PresetInfo;
    export type Preset = presetTypes.Preset;
}

// * Dados
export const basePresetDir = path.join(
    __dirname,
    "../../../../data/presets/info"
);
const baseCommandsDir = path.join(__dirname, "../../../../src/commands");

/**
 * Manipulador de Presets.
 */
export class PresetHandler extends Preset {
    constructor(presetCommand: string) {
        super(presetCommand, basePresetDir);
    }

    // Utilitários Externos
    public static async InitializateAll(): Promise<Ok<void>> {
        const presetDirFiles = await fsp.readdir(basePresetDir);

        for (const presetFile of presetDirFiles) {
            const commandName = string.extractFilename(presetFile).val;

            const loadPreset = await read.JSON<presetTypes.PresetsObject>(
                path.resolve(basePresetDir, presetFile)
            );

            for (const key in loadPreset.val) {
                const preset = loadPreset.val[key];
                const command = await import(
                    (
                        await read.findFilePath(
                            baseCommandsDir,
                            `${commandName}.js`,
                            {
                                recursive: true,
                            }
                        )
                    ).val
                );

                await command.action({ name: preset.name, ...preset.data });
            }
        }

        return Ok.EMPTY;
    }

    //#region           Preset Manipulation
    /**
     * Create a new preset
     * @param presetName The name of the new preset
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
        presetName: string,
        data: UnknownObj
    ): Promise<Ok<types.PresetInfo>> {
        await this.EnsureDataExistence();

        const uuid = this.Utils().createPresetHash(data).val;

        const preset = (await this.Utils().createPreset(uuid, presetName, data))
            .val;

        return Ok({
            uuid,
            name: preset.object.name,
        });
    }
}

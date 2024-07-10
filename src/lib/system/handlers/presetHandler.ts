/**
 * @format
 */

//#region               External Libs
import path from "path";
import fsp from "fs/promises";
import { Ok } from "ts-results";
import { Collection } from "discord.js";
//#endregion
//#region               Modules
import read from "@/system/factories/fs/read.f";
import string from "@/system/factories/string.f";
//#endregion
//#region               Typing
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
}
//#endregion

//#region               Variables
export const basePresetDir = path.join(
    __dirname,
    "../../../../data/presets/info"
);
const baseCommandsDir = path.join(__dirname, "../../../../src/commands");
//#endregion
//#region               Implementation
/**
 * Manipulador de Presets.
 */
export class PresetHandler {
    // Utilitários Externos
    public static async InitializateAll(): Promise<Ok<void>> {
        const presetDirFiles = await fsp.readdir(basePresetDir);

        for (const presetFile of presetDirFiles) {
            const commandName = string.extractFilename(presetFile).val;

            const loadPreset = await read.JSON<types.PresetsObject>(
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
}
//#endregion
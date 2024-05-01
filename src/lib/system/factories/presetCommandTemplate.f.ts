/** @format */
//#region           External Libs
import { Ok } from "ts-results";
//#endregion
//#region           Modules
import string from "@/system/factories/string.f";
import { PresetHandler } from "@/system/handlers/presetHandler";
import { DataBowlHandler } from "@/system/handlers/dataBowl";
import { Err, ErrorKind, ErrorOrigin } from "@/system/handlers/errHandlers";
//#endregion
//#region           Typing
import { types as presetTypes } from "@/system/components/preset";
export namespace types {
    export interface EditResponse {
        message: string;
        obj: {
            presetName: string;
            [key: string]: unknown;
        };
    }

    export interface Utils {
        /**
         * Receive old params and new params
         * and return the final edited data.
         *
         * **OBS**: *If you put "null" as the value
         * it will keep the old value, but if you
         * put "undefined" the value will be removed.*
         * @param oldData Old data.
         * @param receivedData Data entered by user.
         */
        createEditedData: (
            oldData: AnyObj,
            receivedData: AnyObj
        ) => Ok<presetTypes.Preset>;
    }
    export interface Functions {
        /**
         * A wrapper to create a new preset.
         * @param presetName Name of the new preset.
         * @param presetData Data of the new preset.
         */
        new: (
            presetName: string,
            presetData: UnknownObj,
            dataBowlData: UnknownObj
        ) => Promise<Ok<string>>;
        /**
         * A wrapper to edit an existing preset.
         * @param presetName Name of the preset to be edited.
         * @param receivedData Data entered by user.
         */
        edit: (
            presetName: string,
            receivedData: UnknownObj
        ) => Promise<Ok<EditResponse>>;
        /**
         *
         * @param presetName Name of the preset to be removed.
         * @param removePrevious Invalidates the function in
         * messages already listed, this completely
         * removes the preset.
         */
        remove: (
            presetName: string,
            removePrevious: boolean | null
        ) => Promise<Ok<string>>;
        /**
         * Receive a list of all presets.
         * @param withOlds With or without partially deleted presets.
         */
        list: (
            withOlds: boolean | null
        ) => Promise<Ok<presetTypes.PresetInfo[]>>;
    }

    export type Default = (commandName: string) => FactoryObj<Functions>;
}
//#endregion

//#region           Variables
import messages from "D/messages/normal.json";
//#endregion
//#region           Implementation
const Default: types.Default = (commandName) => {
    const utils: FactoryObj<types.Utils> = {
        createEditedData: (oldData, receivedData) => {
            var finalPresetName: string = oldData.presetName;
            var finalData: UnknownObj = {};

            for (const key in oldData) {
                if (key === "presetName") {
                    if (receivedData["presetNewName"]) {
                        finalPresetName = receivedData["presetNewName"];
                        continue;
                    }
                }

                if (receivedData[key] === null) {
                    finalData[key] = oldData[key];
                } else {
                    finalData[key] = receivedData[key];
                }
            }

            return Ok({ data: finalData, name: finalPresetName });
        },
    };

    const factory: FactoryObj<types.Functions> = {
        new: async (presetName, presetData, dataBowlData) => {
            const preset = await new PresetHandler(commandName).New(
                presetName,
                presetData
            );

            await new DataBowlHandler(commandName).New(
                preset.val.uuid,
                dataBowlData
            );

            const sucessMessage = string.varInterpreter(
                messages.commands.mod.autoreport.utils.success.createPreset,
                { presetName: presetName }
            );

            return Ok(sucessMessage.val);
        },
        edit: async (presetName, receivedData) => {
            {
                // Receive old preset
                try {
                    const Handler = new PresetHandler(commandName);

                    var oldPreset = await Handler.Get(presetName);
                } catch (err) {
                    if (err instanceof Err) {
                        const notFound =
                            messages.handlers.preset.errors.presetNotFound;
                        if (err.val.message === notFound)
                            throw new Err({
                                message:
                                    notFound +
                                    "\n\n" +
                                    messages.commands.mod.autoreport.hints
                                        .howCanGetAvailablePresets,
                                origin: ErrorOrigin.User,
                                kind: ErrorKind.NotFound,
                            });
                        else throw err;
                    } else {
                        throw err;
                    }
                }

                var oldPresetData = oldPreset.val.object.data;
            }
            const finalData = utils.createEditedData(
                { presetName, ...oldPresetData },
                receivedData
            ).val;

            // Edit data
            {
                const DataBowl = new DataBowlHandler(commandName);
                const PHandler = new PresetHandler(commandName);

                // Write new preset configs
                await PHandler.SetAllData(presetName, finalData.data);

                // Write new preset name, if it was changed
                if (presetName !== finalData.name) {
                    await DataBowl.Rename(presetName, finalData.name);

                    await PHandler.Rename(presetName, finalData.name);
                }
            }

            const sucessMessage = string.varInterpreter(
                messages.commands.mod.autoreport.sucess.presetEdited,
                { presetName }
            );

            return Ok({
                message: sucessMessage.val,
                obj: { presetName: finalData.name, ...finalData.data },
            });
        },
        remove: async (presetName, removePrevious) => {
            // Instâncias dos Handlers
            const DataBowl = new DataBowlHandler(commandName);
            const PHandler = new PresetHandler(commandName);

            // Funções
            const completelyRemove = async (): Promise<Ok<string>> => {
                await PHandler.Remove(presetName);
                await DataBowl.Remove(presetName);

                const result = await removedMessageWarn({
                    presetName: presetName,
                    completely: true,
                });

                return result;
            };
            const removedMessageWarn = async (params: {
                presetName: string;
                completely: boolean;
            }): Promise<Ok<string>> => {
                const baseString = `O preset **${params.presetName}** foi removido`;

                if (params.completely) {
                    return Ok(`${baseString} por completo!`);
                } else {
                    return Ok(`${baseString}!`);
                }
            };

            // Condições
            const alreadyRunned = presetName.startsWith("old_");

            // Lógica
            if (alreadyRunned && !removePrevious) {
                const warnMessage = string.varInterpreter(
                    messages.commands.mod.autoreport.warns.alreadyRemoved,
                    { presetName: presetName }
                );

                return Ok(warnMessage.val);
            } else if (alreadyRunned && removePrevious) {
                return await completelyRemove();
            } else {
                if (removePrevious) {
                    return await completelyRemove();
                } else {
                    await PHandler.Rename(presetName, `old_${presetName}`);
                    await DataBowl.Rename(presetName, `old_${presetName}`);

                    return removedMessageWarn({
                        presetName: presetName,
                        completely: false,
                    });
                }
            }
        },
        list: async (withOlds) => {
            const presetList: Ok<presetTypes.PresetInfo[]> =
                await new PresetHandler(commandName).List();

            if (withOlds) {
                var finalPresetList = presetList.val;
            } else {
                var finalPresetList = presetList.val.filter(
                    (preset) => !preset.name.startsWith("old_")
                );
            }

            return Ok(finalPresetList);
        },
    };
    return factory;
};
export default Default;
//#endregion

/** @format */

import { Preset, types as presetTypes } from "@/system/components/preset";

class PresetTest extends Preset {
    constructor(commandPreset: string, basePresetDir: string) {
        super(commandPreset, basePresetDir);
    }
    public TestUtils(): presetTypes.UtilsFunctions {
        return this.Utils();
    }
}

describe("Utils Factory Functions", () => {
    const commandPreset = "test";
    const basePresetDir = "../../data/preset";
    const utils = new PresetTest(commandPreset, basePresetDir).TestUtils();

    test("resolvePath method", () => {
        const result = utils.resolvePath("test");

        console.log(result.val);

        expect(result.val).toBe("../../data/preset/test");
    });
    test.todo("createPresetHash method");
});

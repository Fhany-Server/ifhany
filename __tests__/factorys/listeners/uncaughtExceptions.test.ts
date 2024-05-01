/** @format */

import { expect } from "chai";
import listeners from "@/system/factories/listeners.f";

describe("uncaughtExceptions", () => {
    test("O listener foi chamado com sucesso.", () => {
        const result = listeners.uncaughtExceptions();

        expect(result.val).to.deep.equal(void 0);
    });
});

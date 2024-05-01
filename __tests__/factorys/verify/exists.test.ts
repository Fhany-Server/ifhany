import mock from 'mock-fs';
import { expect } from "chai";

import verify from "@/system/factories/verify.f";

describe("exists", () => {
    beforeEach(() => {
        mock({
            '/test/dir': {
                "archive.json": "Me achou :)"
            }
        });
    });
    afterEach(() => {
        mock.restore();
    });

    test("O arquivo existe", async () => {
        const result = await verify.exists("/test/dir/archive.json");

        expect(result.val).to.deep.equal(true);
    });

    test("O arquivo não existe", async () => {
        const result = await verify.exists("/test/archive.imnotreal");

        expect(result.val).to.deep.equal(false);
    });
});

/** @format */

import { CacheHandler } from "@/system/handlers/cache";

describe("CacheHandler", function () {
    var cacheHandler: CacheHandler;

    beforeEach(() => {
        cacheHandler = new CacheHandler();
    });

    test(
        "Está criando uma entrada do cachê, " +
            "retornando o evento e limpando as entradas.",
        function () {
            const key = "teste";
            const value = { message: "Estou aqui!" };
            const mockListener = jest.fn();

            // Listen to events
            cacheHandler.onceValueChanged(mockListener);

            // Create cache entry
            const setResult = cacheHandler.Set(key, value);

            // Verify if it was created
            expect(setResult.ok).toBe(true);
            expect(mockListener).toHaveBeenCalledWith(key, value);

            // Clean up the cache entry
            const clear = cacheHandler.cleanEntry(key);
            expect(clear.ok).toBe(true);
            expect(clear.val).toBe(1);
        }
    );
});

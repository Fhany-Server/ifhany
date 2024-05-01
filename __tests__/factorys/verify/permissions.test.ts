/** @format */

import mock from "mock-fs";

describe("permissions", () => {
    const permissions = `{
        "1102710490922238042": {
            "name": "Fhany -> Dev",
            "commands": {
                "test": {
                    "roles": {
                        "allowed": [
                            "1111111111111111111",
                            "2222222222222222222"
                        ]
                    }
                },
            }
        }
    }`;

    beforeEach(() => {
        mock({
            "/data/": {
                "permissions.json": permissions,
            },
        });
    });
    afterEach(() => {
        mock.restore();
    });

    test.todo("O cargo é permitido!");
});

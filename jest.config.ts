/** @format */
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    preset: "ts-jest",
    moduleNameMapper: {
        "^//(.*)$": "<rootDir>/src/$1",
        "^@/(.*)$": "<rootDir>/src/lib/$1",
        "^>/(.*)$": "<rootDir>/src/commands/$1",
        "^D/(.*)$": "<rootDir>/data/default/$1",
        "^T/(.*)$": "<rootDir>/__tests__/$1",
        "^L/(.*)$": "<rootDir>/logs/$1",
    },
    testPathIgnorePatterns: [
        "__tests__/mocks",
    ],
};

export default config;

import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^tests/(.*)$": "<rootDir>/test/$1",
    "^__mocks__/(.*)$": "<rootDir>/__mocks__/$1",
    "^main$": "<rootDir>/main.ts",
  },
};

export default config;

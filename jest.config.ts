module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts"],
  roots: ["<rootDir>/test"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^obsidian$": "<rootDir>/__mocks__/obsidian.ts",
    "^__mocks__/(.*)$": "<rootDir>/__mocks__/$1",
  },
};

import { jest, mock } from "bun:test";

globalThis.jest = jest;

mock.module("obsidian", () => import("../__mocks__/obsidian"));

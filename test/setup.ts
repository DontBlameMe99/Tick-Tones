import { mock } from "bun:test";

mock.module("obsidian", () => import("../__mocks__/obsidian"));

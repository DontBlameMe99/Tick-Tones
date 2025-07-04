import type { WorkspaceLeaf } from "obsidian";

export function createMockLeaf(): WorkspaceLeaf {
  return {
    view: {
      containerEl: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    },
  } as unknown as WorkspaceLeaf;
}

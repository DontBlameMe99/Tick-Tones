import { RegisteredLeafManager } from "src/registeredLeafManager";
import type { WorkspaceLeaf } from "obsidian";
import { createMockLeaf } from "__mocks__/workspaceLeaf";

describe("RegisteredLeafManager", () => {
  let clickHandler: jest.Mock;
  let manager: RegisteredLeafManager;
  let leaf: WorkspaceLeaf;

  beforeEach(() => {
    clickHandler = jest.fn();
    manager = new RegisteredLeafManager(clickHandler);
    leaf = createMockLeaf();
  });

  describe("registerLeaf", () => {
    it("registers a new leaf and adds the event listener", () => {
      manager.registerLeaf(leaf);

      expect(leaf.view.containerEl.addEventListener).toHaveBeenCalledWith(
        "click",
        clickHandler,
        true,
      );
      expect(manager.getRegisteredLeaves().has(leaf)).toBe(true);
    });

    it("does not register the same leaf twice", () => {
      manager.registerLeaf(leaf);
      manager.registerLeaf(leaf);

      expect(leaf.view.containerEl.addEventListener).toHaveBeenCalledTimes(1);
      expect(manager.getRegisteredLeaves().size).toBe(1);
    });
  });

  describe("unregisterLeaf", () => {
    it("removes the event listener and unregisters the leaf", () => {
      manager.registerLeaf(leaf);
      manager.unregisterLeaf(leaf);

      expect(leaf.view.containerEl.removeEventListener).toHaveBeenCalledWith(
        "click",
        clickHandler,
        true,
      );
      expect(manager.getRegisteredLeaves().has(leaf)).toBe(false);
    });

    it("does nothing if the leaf is not registered", () => {
      manager.unregisterLeaf(leaf);

      expect(leaf.view.containerEl.removeEventListener).not.toHaveBeenCalled();
      expect(manager.getRegisteredLeaves().has(leaf)).toBe(false);
    });
  });

  describe("getRegisteredLeaves", () => {
    it("returns all currently registered leaves", () => {
      const leaf2 = createMockLeaf();

      manager.registerLeaf(leaf);
      manager.registerLeaf(leaf2);

      const leaves = manager.getRegisteredLeaves();

      expect(leaves.has(leaf)).toBe(true);
      expect(leaves.has(leaf2)).toBe(true);
      expect(leaves.size).toBe(2);
    });
  });

  describe("click handler wiring", () => {
    it("calls the click handler when the event is triggered", () => {
      manager.registerLeaf(leaf);

      const handler = (leaf.view.containerEl.addEventListener as jest.Mock).mock
        .calls[0][1];
      const event = { type: "click" };

      handler(event);
      expect(clickHandler).toHaveBeenCalledWith(event);
    });
  });
});

import { WorkspaceLeaf } from "obsidian";

export class RegisteredLeafManager {
  private registeredLeaves: Set<WorkspaceLeaf> = new Set();
  private clickHandler: (evt: MouseEvent) => void;

  constructor(clickHandler: (evt: MouseEvent) => void) {
    this.clickHandler = clickHandler;
  }

  registerLeaf(leaf: WorkspaceLeaf) {
    if (this.registeredLeaves.has(leaf)) return;

    leaf.view.containerEl.addEventListener("click", this.clickHandler, true);
    this.registeredLeaves.add(leaf);
  }

  unregisterLeaf(leaf: WorkspaceLeaf) {
    if (!this.registeredLeaves.has(leaf)) return;

    leaf.view.containerEl.removeEventListener("click", this.clickHandler, true);
    this.registeredLeaves.delete(leaf);
  }

  getRegisteredLeaves() {
    return this.registeredLeaves;
  }
}

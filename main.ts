import { Plugin } from "obsidian";
import { SoundManager } from "src/soundManager";
import { TickTonesSettings, DEFAULT_SETTINGS } from "src/types";
import { TickTonesSettingsTab } from "src/settings";
import { RegisteredLeafManager } from "src/registeredLeafManager";

export default class TickTones extends Plugin {
  settings: TickTonesSettings = DEFAULT_SETTINGS;
  private soundManager: SoundManager;
  private registeredLeafManager: RegisteredLeafManager;
  private clickHandler = (evt: MouseEvent) => {
    const target = evt.target as HTMLInputElement;

    if (!this.soundManager) {
      console.error(
        "SoundManager not initialized. Unable to play the click sound.",
      );
      return;
    }

    if (target?.type === "checkbox") {
      if (target.checked) {
        this.soundManager.playTickSound();
      } else {
        this.soundManager.playUntickSound();
      }
    }
  };

  async onload() {
    this.registeredLeafManager = new RegisteredLeafManager(this.clickHandler);

    try {
      await this.loadSettings();
      this.soundManager = new SoundManager(this.app, this, this.manifest.dir!);
      this.soundManager.init();
    } catch (err) {
      console.error("Failed to load settings, using defaults.", err);
      this.settings = { ...DEFAULT_SETTINGS };
    }

    if (!this.soundManager) {
      console.error("SoundManager not initialized. Aborting.");
      return;
    }

    this.registerCurrentLeaf();
    this.registerFutureLeaves();

    const tickTonesSettingsTab = new TickTonesSettingsTab(
      this.app,
      this,
      this.soundManager,
    );

    this.addSettingTab(tickTonesSettingsTab);
  }

  registerCurrentLeaf() {
    this.app.workspace.onLayoutReady(() => {
      const activeLeaf = this.app.workspace.activeLeaf;

      if (!activeLeaf) {
        return;
      }

      this.registeredLeafManager.registerLeaf(activeLeaf);
    });
  }

  registerFutureLeaves() {
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!leaf) {
          return;
        }

        this.registeredLeafManager.registerLeaf(leaf);
      }),
    );
  }

  async onunload() {
    if (this.registeredLeafManager) {
      this.registeredLeafManager.getRegisteredLeaves().forEach((leaf) => {
        this.registeredLeafManager.unregisterLeaf(leaf);
      });
    }

    if (this.soundManager) {
      this.soundManager.unload();
    }
    this.saveSettings();
  }

  async loadSettings() {
    try {
      this.settings = Object.assign(
        {},
        DEFAULT_SETTINGS,
        await this.loadData(),
      );
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  public saveSettings() {
    this.saveData(this.settings);
  }
}

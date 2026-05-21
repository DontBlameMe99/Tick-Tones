import { MarkdownView, Plugin } from "obsidian";
import { SoundManager } from "src/soundManager";
import { TickTonesSettings, DEFAULT_SETTINGS } from "src/types";
import { TickTonesSettingsTab } from "src/settings";
import { RegisteredLeafManager } from "src/registeredLeafManager";

export default class TickTones extends Plugin {
  settings: TickTonesSettings = DEFAULT_SETTINGS;
  private soundManager!: SoundManager;
  private registeredLeafManager!: RegisteredLeafManager;
  private clickHandler = (evt: MouseEvent) => {
    const target = evt.target as HTMLInputElement;

    if (!this.soundManager) {
      console.error("SoundManager not initialized. Aborting.");
      return;
    }

    if (target?.type !== "checkbox") {
      return;
    }

    // If the active view is not a MarkdownView (e.g. a sidebar or a plugin view), abort.
    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return;
    }

    if (target.checked) {
      this.soundManager.playTickSound().catch((err) => {
        console.error("Failed to play tick sound.", err);
      });
    } else {
      this.soundManager.playUntickSound().catch((err) => {
        console.error("Failed to play untick sound.", err);
      });
    }
  };

  async onload() {
    this.registeredLeafManager = new RegisteredLeafManager(this.clickHandler);

    try {
      await this.loadSettings();
      this.soundManager = new SoundManager(this.app, this, this.manifest.dir!);
      this.soundManager.init().catch((err) => {
        console.error("Failed to initialize sound manager.", err);
      });
    } catch (err) {
      console.error("Failed to load settings, falling back to defaults.", err);
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
      const activeLeaf = this.app.workspace.getMostRecentLeaf();

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

  onunload() {
    (async () => {
      if (this.registeredLeafManager) {
        this.registeredLeafManager.getRegisteredLeaves().forEach((leaf) => {
          this.registeredLeafManager.unregisterLeaf(leaf);
        });
      }

      if (this.soundManager) {
        this.soundManager.unload();
      }
      this.saveSettings();
    })().catch((err) => {
      console.error("Failed to unload plugin.", err);
    });
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
    this.saveData(this.settings).catch((err) => {
      console.error("Failed to save settings.", err);
    });
  }
}

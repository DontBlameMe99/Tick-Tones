import { Plugin } from "obsidian";
import { SoundManager } from "src/soundManager";
import { TickTonesSettings, DEFAULT_SETTINGS } from "src/types";
import { TickTonesSettingsTab } from "src/settings";

export default class TickTones extends Plugin {
  settings: TickTonesSettings = DEFAULT_SETTINGS;
  private soundManager: SoundManager;
  private clickHandler: ((evt: MouseEvent) => void) | undefined;

  async onload() {
    try {
      await this.loadSettings();
      this.soundManager = new SoundManager(this.app, this, this.manifest.dir!);
      this.soundManager.init();
    } catch (err) {
      console.error("Failed to load settings, using defaults.", err);
      this.settings = { ...DEFAULT_SETTINGS };
    }

    this.clickHandler = (evt: MouseEvent) => this.handleCheckboxClick(evt);
    document.addEventListener("click", this.clickHandler, true);

    if (!this.soundManager) {
      console.error("SoundManager not initialized. Aborting.");
      return;
    }

    const tickTonesSettingsTab = new TickTonesSettingsTab(
      this.app,
      this,
      this.soundManager,
    );

    this.addSettingTab(tickTonesSettingsTab);
  }

  async onunload() {
    if (this.clickHandler) {
      document.removeEventListener("click", this.clickHandler, true);
      this.clickHandler = undefined;
    }
    this.soundManager.unload();
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

  private handleCheckboxClick(evt: MouseEvent) {
    const target = evt.target as HTMLInputElement;

    if (target?.type === "checkbox" && target.checked) {
      this.soundManager!.playSound(this.settings.soundSetting);
    }
  }

  public saveSettings() {
    this.saveData(this.settings);
  }
}

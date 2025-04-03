import { Plugin } from "obsidian";
import { SoundManager } from "./soundManager";
import { TickTonesSettings, DEFAULT_SETTINGS } from "./types";
import { TickTonesSettingsTab } from "./settings";

export default class TickTones extends Plugin {
  settings: TickTonesSettings;
  soundManager: SoundManager;

  async onload() {
    await this.loadSettings();

    this.soundManager = new SoundManager(this.app, this.manifest);

    this.addSettingTab(
      new TickTonesSettingsTab(this.app, this, this.soundManager),
    );

    this.registerDomEvent(
      document,
      "click",
      (evt: MouseEvent) => this.handleCheckboxClick(evt),
      { capture: true },
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private handleCheckboxClick(evt: MouseEvent) {
    const target = evt.target as HTMLInputElement;

    if (target?.type === "checkbox" && target.checked) {
      this.soundManager.playSound(this.settings.soundSetting);
    }
  }
}

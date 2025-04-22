import { App, PluginSettingTab, Setting } from "obsidian";
import TickTonesSounds from "../main";
import { SoundManager } from "./soundManager";

export class TickTonesSettingsTab extends PluginSettingTab {
  private soundManager: SoundManager;

  constructor(
    app: App,
    private plugin: TickTonesSounds,
    soundManager: SoundManager,
  ) {
    super(app, plugin);
    this.soundManager = soundManager;
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const sounds = this.soundManager.getSounds();

    if (sounds.length === 0) {
      containerEl.createEl("p", {
        text: "No sounds found. ",
      });
      containerEl.createEl("p", {
        text: "Please add some sounds to the plugin.",
      });
      containerEl.createEl("p", {
        text: "You can find instructions and examples here: ",
      });
      containerEl.createEl("a", {
        text: "README",
        href: "https://github.com/DontBlameMe99/Tick-Tones",
      });
      return;
    }

    new Setting(containerEl)
      .setName("Checkbox tick sound")
      .setDesc("Select a sound to play when a checkbox is ticked.")
      .addDropdown((dropdown) => {
        sounds.forEach((sound) => dropdown.addOption(sound, sound));
        dropdown.setValue(this.plugin.settings.soundSetting);
        dropdown.onChange(async (value) => {
          this.plugin.settings.soundSetting = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Test selected sound")
      .setDesc("Click to play the currently selected sound.")
      .addButton((button) => {
        button.setButtonText("Play sound");
        button.onClick(() => {
          const selectedSound = this.plugin.settings.soundSetting;
          selectedSound && this.soundManager.playSound(selectedSound);
        });
      });
  }
}

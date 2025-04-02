import { App, PluginSettingTab, Setting } from "obsidian";
import TickTonesSounds from "./main";
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

    const soundOptions = Object.keys(this.soundManager.getSounds());

    if (soundOptions.length === 0) {
      containerEl.createEl("p", {
        text: "No sounds found in the assets folder. Please add some sounds to the plugin's assets folder (.wav files) and reload the plugin.",
      });
      return;
    }

    // Dropdown for selecting sound
    new Setting(containerEl)
      .setName("Checkbox Tick Sound")
      .setDesc("Select a sound to play when a checkbox is ticked.")
      .addDropdown((dropdown) => {
        soundOptions.forEach((sound) => dropdown.addOption(sound, sound));
        dropdown.setValue(this.plugin.settings.soundSetting);
        dropdown.onChange(async (value) => {
          this.plugin.settings.soundSetting = value;
          await this.plugin.saveSettings();
        });
      });

    // Button for testing/playing the selected sound
    new Setting(containerEl)
      .setName("Test Selected Sound")
      .setDesc("Click to play the currently selected sound.")
      .addButton((button) => {
        button.setButtonText("Play Sound");
        button.onClick(() => {
          const selectedSound = this.plugin.settings.soundSetting;
          if (selectedSound) {
            this.soundManager.playSound(selectedSound);
          }
        });
      });
  }
}

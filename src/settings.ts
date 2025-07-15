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
      this.createNoSoundsFoundMessage(containerEl);
      return;
    }

    this.createCheckboxTickSoundsSettings(containerEl, sounds);
    this.createCheckboxUntickSoundsSettings(containerEl, sounds);
  }

  private createNoSoundsFoundMessage(containerEl: HTMLElement) {
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
  }

  private createCheckboxTickSoundsSettings(
    containerEl: HTMLElement,
    sounds: string[],
  ) {
    containerEl.createEl("h2", {
      text: "Checkbox tick sounds",
    });

    new Setting(containerEl)
      .setName("Checkbox tick sound enabled")
      .setDesc("Toggle if a sound should be played when a checkbox is ticked.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.tickSoundEnabled);
        toggle.onChange(async (value) => {
          this.plugin.settings.tickSoundEnabled = value;
          this.plugin.saveSettings();
          this.display();
        });
      });

    if (this.plugin.settings.tickSoundEnabled) {
      new Setting(containerEl)
        .setName("Checkbox tick sound")
        .setDesc("Select a sound to play when a checkbox is ticked.")
        .addDropdown((dropdown) => {
          sounds.forEach((sound) => dropdown.addOption(sound, sound));
          dropdown.setValue(this.plugin.settings.tickSound);
          dropdown.onChange(async (value) => {
            this.plugin.settings.tickSound = value;
            this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Modify tick sound volume")
        .setDesc("Adjust the volume of the tick sound.")
        .addSlider((slider) => {
          slider.setLimits(1, 100, 1);
          slider.setDynamicTooltip();
          slider.setValue(this.plugin.settings.tickSoundVolume * 100);
          slider.onChange(async (value) => {
            this.plugin.settings.tickSoundVolume = value / 100;
            this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Test tick sound")
        .setDesc("Click to play the currently selected tick sound.")
        .addButton((button) => {
          button.setButtonText("Play sound");
          button.onClick(() => {
            const selectedSound = this.plugin.settings.tickSound;

            if (!selectedSound) {
              console.warn("No sound selected, cannot play sound.");
              return;
            }

            this.soundManager.playTickSound();
          });
        });
    }
  }

  private createCheckboxUntickSoundsSettings(
    containerEl: HTMLElement,
    sounds: string[],
  ) {
    containerEl.createEl("h2", {
      text: "Checkbox untick sounds",
    });

    new Setting(containerEl)
      .setName("Checkbox untick sound enabled")
      .setDesc(
        "Toggle if a sound should be played when a checkbox is unticked.",
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.untickSoundEnabled);
        toggle.onChange(async (value) => {
          this.plugin.settings.untickSoundEnabled = value;
          this.plugin.saveSettings();
          this.display();
        });
      });

    if (this.plugin.settings.untickSoundEnabled) {
      new Setting(containerEl)
        .setName("Checkbox tick sound")
        .setDesc("Select a sound to play when a checkbox is ticked.")
        .addDropdown((dropdown) => {
          sounds.forEach((sound) => dropdown.addOption(sound, sound));
          dropdown.setValue(this.plugin.settings.untickSound);
          dropdown.onChange(async (value) => {
            this.plugin.settings.untickSound = value;
            this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Modify untick sound volume")
        .setDesc("Adjust the volume of the untick sound.")
        .addSlider((slider) => {
          slider.setLimits(1, 100, 1);
          slider.setDynamicTooltip();
          slider.setValue(this.plugin.settings.untickSoundVolume * 100);
          slider.onChange(async (value) => {
            this.plugin.settings.untickSoundVolume = value / 100;
            this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Test untick sound")
        .setDesc("Click to play the currently selected untick sound.")
        .addButton((button) => {
          button.setButtonText("Play sound");
          button.onClick(() => {
            const selectedSound = this.plugin.settings.untickSound;

            if (!selectedSound) {
              console.warn("No sound selected, cannot play sound.");
              return;
            }

            this.soundManager.playUntickSound();
          });
        });
    }
  }
}

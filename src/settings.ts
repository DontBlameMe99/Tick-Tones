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
      this.createNoSoundsFoundSection(containerEl);
    } else {
      this.createTickSoundsSection(containerEl, sounds);
      this.createUntickSoundsSection(containerEl, sounds);
    }

    this.createReloadSoundsSection(containerEl);
  }

  private createNoSoundsFoundSection(containerEl: HTMLElement) {
    new Setting(containerEl).setName("🎉 Welcome to Tick Tones!").setHeading();

    new Setting(containerEl)
      .setName("Thank you for installing Tick Tones!")
      .setDesc(
        "You're just some small steps away from unlocking the plugin's full potential.",
      );

    new Setting(containerEl).setName("To get started").setHeading();

    new Setting(containerEl)
      .setName("Add your own sound files")
      .setDesc("Add your own sound files to the plugin's sounds folder.");
    new Setting(containerEl)
      .setName("Reload the plugin")
      .setDesc(
        "Reload the plugin or use the Reload button below once you’ve added sounds.",
      );
    new Setting(containerEl)
      .setName("Customize your settings")
      .setDesc("Customize your settings and enjoy!");

    new Setting(containerEl)
      .setName("Need help?")
      .setDesc("See the GitHub page for instructions & examples.")
      .addButton((button) => {
        button.setButtonText("GitHub page");
        button.onClick(() => {
          window.open("https://github.com/DontBlameMe99/Tick-Tones");
        });
      });
  }

  private createTickSoundsSection(containerEl: HTMLElement, sounds: string[]) {
    new Setting(containerEl).setName("Tick sound").setHeading();

    new Setting(containerEl)
      .setName("Tick sound enabled")
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
        .setName("Tick sound")
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
        .setName("Tick sound volume")
        .setDesc("Adjust the volume of the sound when a checkbox is ticked.")
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
        .setDesc("Click to test out your checkbox tick sound configuration.")
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

  private createUntickSoundsSection(
    containerEl: HTMLElement,
    sounds: string[],
  ) {
    new Setting(containerEl).setName("Untick sound").setHeading();

    new Setting(containerEl)
      .setName("Untick sound enabled")
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
        .setName("Untick sound")
        .setDesc("Select a sound to be played when a checkbox is unticked.")
        .addDropdown((dropdown) => {
          sounds.forEach((sound) => dropdown.addOption(sound, sound));
          dropdown.setValue(this.plugin.settings.untickSound);
          dropdown.onChange(async (value) => {
            this.plugin.settings.untickSound = value;
            this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Untick sound volume")
        .setDesc("Adjust the volume of the sound when a checkbox is unticked.")
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
        .setDesc("Click to test out your checkbox untick sound configuration.")
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

  private createReloadSoundsSection(containerEl: HTMLElement) {
    new Setting(containerEl).setName("Sounds").setHeading();

    new Setting(containerEl)
      .setName("Reload")
      .setDesc("Click to reload the available sounds.")
      .addButton((button) => {
        button.setButtonText("Reload sounds");
        button.onClick(() => {
          this.soundManager.reloadSounds().then(() => {
            this.display();
          });
        });
      });
  }
}

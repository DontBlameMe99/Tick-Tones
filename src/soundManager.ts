import { App } from "obsidian";
import { SoundLoader } from "./soundLoader";
import { Howl } from "howler";
import TickTones from "main";

export class SoundManager {
  private loadedSounds: Record<string, string> = {};
  private soundCache: Record<string, Howl> = {};
  private soundLoader: SoundLoader;
  private plugin: TickTones;

  constructor(app: App, plugin: TickTones, pluginDir: string) {
    this.plugin = plugin;
    this.soundLoader = new SoundLoader(app, pluginDir);
  }

  async init(): Promise<void> {
    this.loadedSounds = await this.soundLoader.loadSounds();
  }

  private async playSound(sound: string, volume: number): Promise<void> {
    if (Object.keys(this.loadedSounds).length === 0) {
      console.warn("No sounds found. Aborting.");
      return;
    }

    const soundData = this.loadedSounds[sound];

    if (!soundData) {
      console.error(`Sound "${sound}" not found.`);
      return;
    }

    let howl = this.soundCache[sound];

    if (!howl) {
      howl = new Howl({ src: [soundData], preload: true });
      this.soundCache[sound] = howl;
    }

    howl.volume(volume);

    howl.play();
  }

  public async playTickSound(): Promise<void> {
    if (!this.plugin.settings.tickSoundEnabled) {
      return;
    }

    this.playSound(
      this.plugin.settings.tickSound,
      this.plugin.settings.tickSoundVolume,
    );
  }

  public async playUntickSound(): Promise<void> {
    if (!this.plugin.settings.untickSoundEnabled) {
      return;
    }

    this.playSound(
      this.plugin.settings.untickSound,
      this.plugin.settings.untickSoundVolume,
    );
  }

  public getSounds(): string[] {
    return Object.keys(this.loadedSounds);
  }

  public async reloadSounds(): Promise<void> {
    return this.soundLoader.loadSounds().then((sounds) => {
      this.loadedSounds = sounds;
    });
  }

  public unload(): void {
    Object.values(this.soundCache).forEach((howl) => {
      howl.unload();
    });
    this.soundCache = {};
  }
}

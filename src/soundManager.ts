import { App, Notice } from "obsidian";
import { SoundLoader } from "./soundLoader";
import { Howl } from "howler";

export class SoundManager {
  private loadedSounds: Record<string, string> = {};
  private soundCache: Record<string, Howl> = {};
  private soundLoader: SoundLoader;

  constructor(app: App, pluginDir: string) {
    this.soundLoader = new SoundLoader(app, pluginDir);
  }

  async init(): Promise<void> {
    this.loadedSounds = await this.soundLoader.loadSounds();
  }

  /**
   * Plays a sound by name. Loads and caches the Howl instance if needed.
   */
  public async playSound(chosenSound: string): Promise<void> {
    if (Object.keys(this.loadedSounds).length === 0) {
      console.warn("No sounds found. Aborting.");
      return;
    }

    const soundData = this.loadedSounds[chosenSound];

    if (!soundData) {
      console.error(`Sound "${chosenSound}" not found.`);
      return;
    }

    let howl = this.soundCache[chosenSound];

    if (!howl) {
      howl = new Howl({ src: [soundData], preload: true });
      howl.volume(0.6);
      this.soundCache[chosenSound] = howl;
    }

    howl.play();
  }

  public getSounds(): string[] {
    return Object.keys(this.loadedSounds);
  }

  public unload(): void {
    Object.values(this.soundCache).forEach((howl) => {
      howl.unload();
    });
    this.soundCache = {};
  }
}

import { Howl } from "howler";
import { SoundLoader } from "./soundLoader"; // Import the loadSounds function
import { App } from "obsidian";

export class SoundManager {
  private loadedSounds: Record<string, string>;
  private app: App;
  private manifest: any;
  private soundLoader: SoundLoader;

  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
    this.soundLoader = new SoundLoader(app, manifest);
    this.loadedSounds = this.soundLoader.loadSounds();
  }

  /**
   * Plays a sound by key. If no sounds are loaded, it dynamically loads them first.
   * @param chosenSound - The key of the sound to play.
   */
  public playSound(chosenSound: string): void {
    if (Object.keys(this.loadedSounds).length === 0) {
      console.warn("No sounds loaded. Trying to reload sounds...");
      this.loadedSounds = this.soundLoader.loadSounds();
    }

    const soundData = this.loadedSounds[chosenSound];

    if (!soundData) {
      console.error(`Sound "${chosenSound}" not found.`);
      return;
    }

    const sound = new Howl({ src: [soundData], preload: true });

    sound.volume(0.6);
    sound.play();
  }

  /**
   * Returns the loaded sounds.
   * @returns A record of sound keys and paths.
   */
  public getSounds(): Record<string, string> {
    return this.loadedSounds;
  }
}

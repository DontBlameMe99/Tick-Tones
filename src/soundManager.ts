import { App } from "obsidian";
import { SoundLoader } from "./soundLoader";
import { Howl } from "howler";

export class SoundManager {
  private loadedSounds: Record<string, string> = {};
  private soundLoader: SoundLoader;

  constructor(app: App, manifest: any) {
    this.soundLoader = new SoundLoader(app, manifest);
  }

  async init(): Promise<void> {
    this.loadedSounds = await this.soundLoader.loadSounds();
  }

  public async playSound(chosenSound: string): Promise<void> {
    if (Object.keys(this.loadedSounds).length === 0) {
      this.loadedSounds = await this.soundLoader.loadSounds();
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

  public getSounds(): Record<string, string> {
    return this.loadedSounds;
  }
}

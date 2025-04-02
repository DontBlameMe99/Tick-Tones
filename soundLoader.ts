import * as fs from "fs";
import * as path from "path";
import { App, FileSystemAdapter } from "obsidian";

export class SoundLoader {
  private app: App;
  private manifest: any;
  private pluginPath: string;

  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
    this.pluginPath = this.getPluginPath();
  }

  /**
   * Loads all `.wav` files from the `assets` folder of the plugin's directory.
   * @returns A record mapping sound file names (without extensions) to their Base64-encoded data URIs.
   */
  public loadSounds(): Record<string, string> {
    const assetsPath = path.join(this.pluginPath, "assets");
    const soundFiles: Record<string, string> = {};

    try {
      if (!fs.existsSync(assetsPath)) {
        console.error(`Assets folder not found at: ${assetsPath}`);
        return soundFiles;
      }

      fs.readdirSync(assetsPath).forEach((file: string) => {
        if (path.extname(file).toLowerCase() === ".wav") {
          const fileNameWithoutExt = path.basename(file, ".wav");
          const filePath = path.join(assetsPath, file);
          const base64Data = `data:audio/wav;base64,${fs.readFileSync(filePath).toString("base64")}`;
          soundFiles[fileNameWithoutExt] = base64Data;
        }
      });
    } catch (err) {
      console.error(`Error loading sounds from ${assetsPath}:`, err);
    }

    return soundFiles;
  }

  /**
   * Retrieves the plugin's directory path within the Obsidian vault.
   * @returns The absolute path to the plugin's directory.
   * @throws An error if the adapter is unsupported or cannot determine plugin path.
   */
  private getPluginPath(): string {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return `${adapter.getBasePath()}/${this.app.vault.configDir}/plugins/${this.manifest.id}`;
    }
    throw new Error("Unsupported adapter: Cannot determine plugin path.");
  }
}

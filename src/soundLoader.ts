import { App, Vault } from "obsidian";

export class SoundLoader {
  private vault: Vault;
  private manifest: any;

  constructor(app: App, manifest: any) {
    this.vault = app.vault;
    this.manifest = manifest;
  }

  /**
   * Loads all `.wav` files from the plugin's assets folder
   * @returns Record mapping sound names to Base64 data URIs
   */
  public async loadSounds(): Promise<Record<string, string>> {
    const assetsPath = `${this.manifest.dir}/assets`;
    const soundFiles: Record<string, string> = {};

    try {
      const assetsExist = await this.vault.adapter.exists(assetsPath);

      if (!assetsExist) {
        console.error("Assets folder not found");
        return soundFiles;
      }

      const files = await this.vault.adapter.list(assetsPath);

      for (const file of files.files) {
        if (file.toLowerCase().endsWith(".wav")) {
          const fileName =
            file
              .split("/")
              .pop()
              ?.replace(/\.wav$/i, "") || "";

          const fileData = await this.vault.adapter.readBinary(file);
          const base64Data = uint8ToBase64(new Uint8Array(fileData));

          soundFiles[fileName] = `data:audio/wav;base64,${base64Data}`;
        }
      }
    } catch (err) {
      console.error("Error loading sounds:", err);
    }

    return soundFiles;
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const length = bytes.byteLength;

  for (let i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

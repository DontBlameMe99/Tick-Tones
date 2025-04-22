import { App, Vault, normalizePath } from "obsidian";

export class SoundLoader {
  private vault: Vault;
  private assetsPath: string;

  constructor(app: App, pluginDir: string) {
    this.vault = app.vault;
    this.assetsPath = normalizePath(`${pluginDir}/assets`);
  }

  /**
   * Loads all supported audio files from the plugin's assets folder.
   * @returns Record mapping sound names to Base64 data URIs
   */
  public async loadSounds(): Promise<Record<string, string>> {
    const soundFiles: Record<string, string> = {};
    const supportedExtensions = [
      ".wav",
      ".mp3",
      ".ogg",
      ".flac",
      ".aac",
      ".m4a",
      ".opus",
      ".webm",
    ];

    try {
      const assetsExist = await this.vault.adapter.exists(this.assetsPath);

      if (!assetsExist) {
        console.error("Assets folder not found:", this.assetsPath);
        return soundFiles;
      }

      const files = await this.vault.adapter.list(this.assetsPath);

      for (const file of files.files) {
        const ext = file.slice(file.lastIndexOf(".")).toLowerCase();

        if (supportedExtensions.includes(ext)) {
          const fileName = file.split("/").pop()!.split(".")[0];

          const fileData = await this.vault.adapter.readBinary(file);
          const base64Data = uint8ToBase64(new Uint8Array(fileData));
          const mimeType = getMimeType(ext);

          soundFiles[fileName] = `data:${mimeType};base64,${base64Data}`;
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

function getMimeType(ext: string): string {
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".ogg":
      return "audio/ogg";
    case ".flac":
      return "audio/flac";
    case ".aac":
      return "audio/aac";
    case ".m4a":
      return "audio/mp4";
    case ".opus":
      return "audio/opus";
    case ".webm":
      return "audio/webm";
    case ".wav":
    default:
      return "audio/wav";
  }
}

import { SoundLoader } from "src/soundLoader";

jest.mock("obsidian", () => ({
  App: jest.fn(),
  Vault: jest.fn(),
  normalizePath: jest.fn((p: string) => p.replace(/\/+/g, "/")),
}));

// Helper for btoa in Node
describe("SoundLoader", () => {
  let app: any;
  let vault: any;
  let adapter: any;

  beforeEach(() => {
    adapter = {
      exists: jest.fn(),
      list: jest.fn(),
      readBinary: jest.fn(),
    };
    vault = { adapter };
    app = { vault };
  });

  it("returns empty object if assets folder does not exist", async () => {
    // Turn off console.error
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    adapter.exists.mockResolvedValue(false);

    const loader = new SoundLoader(app, "/plugins/my-plugin");
    const sounds = await loader.loadSounds();

    expect(adapter.exists).toHaveBeenCalledWith("/plugins/my-plugin/assets");
    expect(sounds).toEqual({});
    errorSpy.mockRestore();
  });

  it("returns empty object if assets folder exists but has no files", async () => {
    adapter.exists.mockResolvedValue(true);
    adapter.list.mockResolvedValue({ files: [] });

    const loader = new SoundLoader(app, "/plugins/my-plugin");
    const sounds = await loader.loadSounds();

    expect(adapter.list).toHaveBeenCalledWith("/plugins/my-plugin/assets");
    expect(sounds).toEqual({});
  });

  it("loads only supported audio files and encodes as base64", async () => {
    adapter.exists.mockResolvedValue(true);
    adapter.list.mockResolvedValue({
      files: [
        "/plugins/my-plugin/assets/ding.mp3",
        "/plugins/my-plugin/assets/bloop.wav",
        "/plugins/my-plugin/assets/readme.txt", // unsupported
        "/plugins/my-plugin/assets/sound.ogg",
      ],
    });

    // Mock readBinary for each file
    adapter.readBinary
      .mockResolvedValueOnce([100, 105, 110, 103]) // "ding"
      .mockResolvedValueOnce([98, 108, 111, 111, 112]) // "bloop"
      .mockResolvedValueOnce([115, 111, 117, 110, 100]); // "sound"

    const loader = new SoundLoader(app, "/plugins/my-plugin");
    const sounds = await loader.loadSounds();

    // Validate keys and values
    expect(Object.keys(sounds).sort()).toEqual(["bloop", "ding", "sound"]);
    expect(sounds.ding).toMatch(/^data:audio\/mpeg;base64,/);
    expect(sounds.bloop).toMatch(/^data:audio\/wav;base64,/);
    expect(sounds.sound).toMatch(/^data:audio\/ogg;base64,/);

    // Validate actual base64 content
    const base64ForDing = Buffer.from("ding", "binary").toString("base64");
    expect(sounds.ding).toContain(base64ForDing);
  });

  it("skips unsupported file extensions", async () => {
    adapter.exists.mockResolvedValue(true);
    adapter.list.mockResolvedValue({
      files: [
        "/plugins/my-plugin/assets/ignore.txt",
        "/plugins/my-plugin/assets/keep.mp3",
      ],
    });
    adapter.readBinary.mockResolvedValue([107, 101, 101, 112]); // "keep"

    const loader = new SoundLoader(app, "/plugins/my-plugin");
    const sounds = await loader.loadSounds();

    expect(Object.keys(sounds)).toEqual(["keep"]);
    expect(sounds.keep).toMatch(/^data:audio\/mpeg;base64,/);
  });

  it("handles errors gracefully and returns empty object", async () => {
    // Turn off console.error
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    adapter.exists.mockRejectedValue(new Error("adapter error"));

    const loader = new SoundLoader(app, "/plugins/my-plugin");
    const sounds = await loader.loadSounds();

    expect(sounds).toEqual({});
    errorSpy.mockRestore();
  });
});

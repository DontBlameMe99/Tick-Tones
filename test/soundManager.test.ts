import { Howl } from "howler";
import { SoundManager } from "src/soundManager";

jest.mock("howler");

// Mock SoundLoader
const mockLoadSounds = jest.fn();
jest.mock("src/soundLoader", () => ({
  SoundLoader: jest.fn().mockImplementation(() => ({
    loadSounds: mockLoadSounds,
  })),
}));

function createMockPlugin(settings = {}) {
  return {
    settings: {
      soundVolume: 0.7,
      ...settings,
    },
  };
}

describe("SoundManager", () => {
  let app: any;
  let plugin: any;
  let soundManager: SoundManager;
  let HowlMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    app = {};
    plugin = createMockPlugin();
    soundManager = new SoundManager(app, plugin, "/plugins/my-plugin");
    HowlMock = Howl as unknown as jest.Mock;
  });

  describe("init", () => {
    it("loads sounds using SoundLoader", async () => {
      mockLoadSounds.mockResolvedValue({
        lorem: "data:audio/mp3;base64,lorem",
      });

      await soundManager.init();

      expect(mockLoadSounds).toHaveBeenCalled();
      expect(soundManager.getSounds()).toEqual(["lorem"]);
    });
  });

  describe("playSound", () => {
    beforeEach(async () => {
      // Pre-load some sounds
      mockLoadSounds.mockResolvedValue({
        lorem: "data:audio/mp3;base64,lorem",
        ipsum: "data:audio/wav;base64,ipsum",
      });
      await soundManager.init();
    });

    it("warns if no sounds are loaded", async () => {
      soundManager["loadedSounds"] = {};
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      await soundManager.playSound("lorem");
      expect(warnSpy).toHaveBeenCalledWith("No sounds found. Aborting.");
      warnSpy.mockRestore();
    });

    it("errors if chosen sound does not exist", async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await soundManager.playSound("notfound");
      expect(errorSpy).toHaveBeenCalledWith('Sound "notfound" not found.');
      errorSpy.mockRestore();
    });

    it("creates, caches, and plays a new Howl if not cached", async () => {
      // Setup Howl mock instance
      const play = jest.fn();
      const volume = jest.fn();
      HowlMock.mockImplementation(function (this: any) {
        this.play = play;
        this.volume = volume;
      });

      await soundManager.playSound("lorem");

      // Howl should be constructed with correct src
      expect(HowlMock).toHaveBeenCalledWith({
        src: ["data:audio/mp3;base64,lorem"],
        preload: true,
      });

      // Should set volume and play
      expect(volume).toHaveBeenCalledWith(0.7);
      expect(play).toHaveBeenCalled();

      // Should cache the Howl instance
      expect(soundManager["soundCache"].lorem).toBeDefined();
    });

    it("reuses cached Howl and plays it", async () => {
      // Setup Howl mock instance
      const play = jest.fn();
      const volume = jest.fn();
      HowlMock.mockImplementation(function (this: any) {
        this.play = play;
        this.volume = volume;
      });

      // First play caches the Howl
      await soundManager.playSound("lorem");
      const cachedHowl = soundManager["soundCache"].lorem;

      // Play again
      await soundManager.playSound("lorem");
      expect(HowlMock).toHaveBeenCalledTimes(1); // Only constructed once
      expect(cachedHowl.volume).toHaveBeenCalledWith(0.7);
      expect(cachedHowl.play).toHaveBeenCalled();
    });
  });

  describe("getSounds", () => {
    it("returns keys of loadedSounds", async () => {
      mockLoadSounds.mockResolvedValue({ foo: "bar", baz: "qux" });
      await soundManager.init();
      expect(soundManager.getSounds().sort()).toEqual(["baz", "foo"]);
    });
  });

  describe("unload", () => {
    it("unloads all Howl instances and clears cache", async () => {
      // Setup Howl mock instance
      const unload = jest.fn();

      HowlMock.mockImplementation(function (this: any) {
        this.unload = unload;
        this.play = jest.fn();
        this.volume = jest.fn();
      });

      // Play two sounds to cache them
      mockLoadSounds.mockResolvedValue({
        lorem: "data:audio/mp3;base64,lorem",
        ipsum: "data:audio/wav;base64,ipsum",
      });
      await soundManager.init();
      await soundManager.playSound("lorem");
      await soundManager.playSound("ipsum");

      expect(Object.keys(soundManager["soundCache"]).length).toBe(2);

      soundManager.unload();

      // Both Howl instances should have unload called
      expect(unload).toHaveBeenCalledTimes(2);
      expect(soundManager["soundCache"]).toEqual({});
    });
  });
});

import { App, Setting } from "obsidian";
import { TickTonesSettingsTab } from "../src/settings";
import TickTones from "../main";
import { SoundManager } from "../src/soundManager";
import { DEFAULT_SETTINGS } from "../src/types";

jest.mock("obsidian");

describe("TickTonesSettingsTab", () => {
  let app: App;
  let plugin: TickTones;
  let soundManager: SoundManager;
  let tab: TickTonesSettingsTab;
  let containerEl: any;

  beforeEach(() => {
    jest.clearAllMocks();

    app = {} as App;
    plugin = {
      settings: { ...DEFAULT_SETTINGS },
      saveSettings: jest.fn(),
    } as any;

    soundManager = {
      getSounds: jest.fn().mockReturnValue([]),
      reloadSounds: jest.fn().mockResolvedValue(undefined),
      playTickSound: jest.fn(),
      playUntickSound: jest.fn(),
    } as any;

    containerEl = {
      empty: jest.fn(),
      createDiv: jest.fn().mockReturnValue({
        style: {},
        createEl: jest.fn().mockReturnValue({
          style: {},
          onclick: null,
        }),
      }),
    };

    tab = new TickTonesSettingsTab(app, plugin, soundManager);
    (tab as any).containerEl = containerEl;

    (Setting as jest.Mock).mockImplementation(function (this: any) {
      this.setName = jest.fn().mockReturnThis();
      this.setDesc = jest.fn().mockReturnThis();
      this.setHeading = jest.fn().mockReturnThis();
      this.addToggle = jest.fn().mockReturnThis();
      this.addDropdown = jest.fn().mockReturnThis();
      this.addSlider = jest.fn().mockReturnThis();
      this.addButton = jest.fn().mockReturnThis();
      return this;
    });
  });

  describe("display", () => {
    it("renders no sounds found section when no sounds available", () => {
      soundManager.getSounds = jest.fn().mockReturnValue([]);
      tab.display();

      expect(containerEl.empty).toHaveBeenCalled();
      expect(Setting).toHaveBeenCalled();

      expect(
        (Setting as jest.Mock).mock.instances[0].setName,
      ).toHaveBeenCalledWith("🎉 Welcome to Tick Tones!");
    });

    it("renders tick settings when sounds are available", () => {
      soundManager.getSounds = jest.fn().mockReturnValue(["lorem", "ipsum"]);
      tab.display();

      expect(containerEl.empty).toHaveBeenCalled();

      const instances = (Setting as jest.Mock).mock.instances;
      const tickSoundHeading = instances.find((inst: any) =>
        inst.setName.mock.calls.some((call: any) => call[0] === "Tick sound"),
      );
      expect(tickSoundHeading).toBeDefined();
      expect(tickSoundHeading.setHeading).toHaveBeenCalled();
    });
  });

  describe("tick sound enabled toggle", () => {
    it("tick sound enabled toggle onChange updates plugin setting, saves, and re-renders", async () => {
      soundManager.getSounds = jest.fn().mockReturnValue(["lorem"]);
      const displaySpy = jest.spyOn(tab, "display");
      tab.display();

      const instances = (Setting as jest.Mock).mock.instances;
      const tickEnabledSetting = instances.find((inst: any) =>
        inst.setName.mock.calls.some(
          (call: any) => call[0] === "Tick sound enabled",
        ),
      );

      expect(tickEnabledSetting).toBeDefined();
      const toggleCallback = tickEnabledSetting.addToggle.mock.calls[0][0];
      const mockToggle = {
        setValue: jest.fn(),
        onChange: jest.fn((cb) => cb(false)),
      };
      toggleCallback(mockToggle);

      expect(mockToggle.setValue).toHaveBeenCalledWith(true);
      expect(plugin.settings.tickSoundEnabled).toBe(false);
      expect(plugin.saveSettings).toHaveBeenCalled();
      expect(displaySpy).toHaveBeenCalled();
    });
  });

  describe("random tick sound toggle", () => {
    it("random tick sound toggle onChange updates plugin setting, saves, and re-renders", async () => {
      soundManager.getSounds = jest.fn().mockReturnValue(["lorem"]);
      const displaySpy = jest.spyOn(tab, "display");
      tab.display();

      const instances = (Setting as jest.Mock).mock.instances;
      const randomTickSetting = instances.find((inst: any) =>
        inst.setName.mock.calls.some(
          (call: any) => call[0] === "Use random tick sound",
        ),
      );

      expect(randomTickSetting).toBeDefined();
      const toggleCallback = randomTickSetting.addToggle.mock.calls[0][0];
      const mockToggle = {
        setValue: jest.fn(),
        onChange: jest.fn((cb) => cb(true)),
      };
      toggleCallback(mockToggle);

      expect(mockToggle.setValue).toHaveBeenCalledWith(false);
      expect(plugin.settings.useRandomTickSound).toBe(true);
      expect(plugin.saveSettings).toHaveBeenCalled();
      expect(displaySpy).toHaveBeenCalled();
    });
  });

  describe("random sound list buttons", () => {
    it("creates buttons for each sound when random tick is enabled", () => {
      soundManager.getSounds = jest
        .fn()
        .mockReturnValue(["lorem", "ipsum", "dolor"]);
      plugin.settings.useRandomTickSound = true;
      plugin.settings.tickSounds = ["lorem"];

      const mockButtons: any[] = [];
      const mockCreateEl = jest.fn((type, options) => {
        const button = {
          style: {},
          onclick: null,
          type,
          ...options,
        };
        mockButtons.push(button);
        return button;
      });

      const mockDiv = {
        style: {},
        createEl: mockCreateEl,
      };
      containerEl.createDiv = jest.fn().mockReturnValue(mockDiv);

      tab.display();

      expect(containerEl.createDiv).toHaveBeenCalledWith("tick-sound-list");
      expect(mockCreateEl).toHaveBeenCalledTimes(3);
      expect(mockButtons[0].text).toBe("lorem");
      expect(mockButtons[0].cls).toBe("mod-cta");
      expect(mockButtons[1].text).toBe("ipsum");
      expect(mockButtons[1].cls).toBe("");
      expect(mockButtons[2].text).toBe("dolor");
      expect(mockButtons[2].cls).toBe("");
    });

    it("adds sound to list when unselected button is clicked", async () => {
      soundManager.getSounds = jest.fn().mockReturnValue(["lorem", "ipsum"]);
      plugin.settings.useRandomTickSound = true;
      plugin.settings.tickSounds = [];

      const mockButtons: any[] = [];
      const mockCreateEl = jest.fn((type, options) => {
        const button = {
          style: {},
          onclick: null as any,
          type,
          ...options,
        };
        mockButtons.push(button);
        return button;
      });

      const mockDiv = {
        style: {},
        createEl: mockCreateEl,
      };
      containerEl.createDiv = jest.fn().mockReturnValue(mockDiv);

      const displaySpy = jest.spyOn(tab, "display");
      tab.display();

      expect(mockButtons[0].onclick).not.toBeNull();
      await mockButtons[0].onclick();

      expect(plugin.settings.tickSounds).toContain("lorem");
      expect(plugin.saveSettings).toHaveBeenCalled();
      expect(displaySpy).toHaveBeenCalledTimes(2);
    });

    it("removes sound from list when selected button is clicked", async () => {
      soundManager.getSounds = jest.fn().mockReturnValue(["lorem", "ipsum"]);
      plugin.settings.useRandomTickSound = true;
      plugin.settings.tickSounds = ["lorem", "ipsum"];

      const mockButtons: any[] = [];
      const mockCreateEl = jest.fn((type, options) => {
        const button = {
          style: {},
          onclick: null as any,
          type,
          ...options,
        };
        mockButtons.push(button);
        return button;
      });

      const mockDiv = {
        style: {},
        createEl: mockCreateEl,
      };
      containerEl.createDiv = jest.fn().mockReturnValue(mockDiv);

      const displaySpy = jest.spyOn(tab, "display");
      tab.display();

      expect(mockButtons[0].onclick).not.toBeNull();
      await mockButtons[0].onclick();

      expect(plugin.settings.tickSounds).not.toContain("lorem");
      expect(plugin.settings.tickSounds).toContain("ipsum");
      expect(plugin.saveSettings).toHaveBeenCalled();
      expect(displaySpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("reload sounds button", () => {
    it("reload sounds button onClick reloads sounds and re-renders", async () => {
      soundManager.getSounds = jest.fn().mockReturnValue(["lorem"]);
      tab.display();

      const instances = (Setting as jest.Mock).mock.instances;
      const reloadSetting = instances.find((inst: any) =>
        inst.setName.mock.calls.some((call: any) => call[0] === "Reload"),
      );

      expect(reloadSetting).toBeDefined();
      const buttonCallback = reloadSetting.addButton.mock.calls[0][0];
      const mockButton = {
        setButtonText: jest.fn(),
        onClick: jest.fn(async (cb) => await cb()),
      };

      await buttonCallback(mockButton);

      expect(mockButton.setButtonText).toHaveBeenCalledWith("Reload sounds");
      expect(soundManager.reloadSounds).toHaveBeenCalled();
    });
  });
});

import { createMockContainerEl } from "__mocks__/containerEl";
import { createMockPlugin } from "__mocks__/plugin";
import { createMockSoundManager } from "__mocks__/soundManager";
import { App, Setting } from "obsidian";
import { TickTonesSettingsTab } from "src/settings";

describe("TickTonesSettingsTab", () => {
  let containerEl: any;
  let plugin: any;
  let soundManager: any;
  let tab: TickTonesSettingsTab;

  beforeEach(() => {
    jest.clearAllMocks();
    containerEl = createMockContainerEl();
    plugin = createMockPlugin({
      tickSoundEnabled: true,
      tickSound: "lorem",
      tickSoundVolume: 0.5,
      untickSoundEnabled: false, // Disabled by default
      untickSound: "ipsum",
      untickSoundVolume: 0.3,
    });
    soundManager = createMockSoundManager();
    tab = new TickTonesSettingsTab({} as App, plugin, soundManager);
    (tab as any).containerEl = containerEl;
  });

  it("shows instructions when no sounds are found", () => {
    soundManager.getSounds.mockReturnValue([]);
    tab.display();

    expect(containerEl.empty).toHaveBeenCalled();
    expect(containerEl.createEl).toHaveBeenCalledTimes(4);
    expect(containerEl.createEl).toHaveBeenNthCalledWith(1, "p", {
      text: "No sounds found. ",
    });
    expect(containerEl.createEl).toHaveBeenNthCalledWith(2, "p", {
      text: "Please add some sounds to the plugin.",
    });
    expect(containerEl.createEl).toHaveBeenNthCalledWith(3, "p", {
      text: "You can find instructions and examples here: ",
    });
    expect(containerEl.createEl).toHaveBeenNthCalledWith(4, "a", {
      text: "README",
      href: "https://github.com/DontBlameMe99/Tick-Tones",
    });
  });

  it("renders tick settings when tick sounds are enabled and untick toggle when untick sounds are disabled", () => {
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    expect(containerEl.empty).toHaveBeenCalled();

    // Should create headers
    expect(containerEl.createEl).toHaveBeenCalledWith("h2", {
      text: "Checkbox tick sounds",
    });
    expect(containerEl.createEl).toHaveBeenCalledWith("h2", {
      text: "Checkbox untick sounds",
    });

    // Should create 5 Setting instances:
    // 1 tick toggle + 3 tick settings (since enabled) + 1 untick toggle (since disabled)
    expect((Setting as jest.Mock).mock.calls.length).toBe(5);

    // Tick sound enabled toggle
    const tickEnabledSetting = (Setting as jest.Mock).mock.instances[0];
    expect(tickEnabledSetting.setName).toHaveBeenCalledWith(
      "Checkbox tick sound enabled",
    );
    expect(tickEnabledSetting.addToggle).toHaveBeenCalled();

    // Tick sound dropdown (rendered because tick is enabled)
    const tickDropdownSetting = (Setting as jest.Mock).mock.instances[1];
    expect(tickDropdownSetting.setName).toHaveBeenCalledWith(
      "Checkbox tick sound",
    );
    expect(tickDropdownSetting.addDropdown).toHaveBeenCalled();

    // Tick sound volume slider (rendered because tick is enabled)
    const tickSliderSetting = (Setting as jest.Mock).mock.instances[2];
    expect(tickSliderSetting.setName).toHaveBeenCalledWith(
      "Modify tick sound volume",
    );
    expect(tickSliderSetting.addSlider).toHaveBeenCalled();

    // Tick sound test button (rendered because tick is enabled)
    const tickButtonSetting = (Setting as jest.Mock).mock.instances[3];
    expect(tickButtonSetting.setName).toHaveBeenCalledWith("Test tick sound");
    expect(tickButtonSetting.addButton).toHaveBeenCalled();

    // Untick sound enabled toggle (only this is rendered since untick is disabled)
    const untickEnabledSetting = (Setting as jest.Mock).mock.instances[4];
    expect(untickEnabledSetting.setName).toHaveBeenCalledWith(
      "Checkbox untick sound enabled",
    );
    expect(untickEnabledSetting.addToggle).toHaveBeenCalled();
  });

  it("renders all settings when both tick and untick sounds are enabled", () => {
    plugin.settings.untickSoundEnabled = true; // Enable untick sounds
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    // Should create 8 Setting instances (4 for tick, 4 for untick)
    expect((Setting as jest.Mock).mock.calls.length).toBe(8);
  });

  it("renders only toggles when both tick and untick sounds are disabled", () => {
    plugin.settings.tickSoundEnabled = false; // Disable tick sounds
    plugin.settings.untickSoundEnabled = false; // Keep untick sounds disabled
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    // Should create 2 Setting instances (just the two toggles)
    expect((Setting as jest.Mock).mock.calls.length).toBe(2);
  });

  it("tick sound enabled toggle onChange updates plugin setting, saves, and re-renders", async () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    const displaySpy = jest.spyOn(tab, "display");
    tab.display();

    const tickEnabledSetting = (Setting as jest.Mock).mock.instances[0];
    const toggleCallback = tickEnabledSetting.addToggle.mock.calls[0][0];
    const mockToggle = {
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(false)),
    };
    toggleCallback(mockToggle);

    expect(mockToggle.setValue).toHaveBeenCalledWith(true);
    expect(plugin.settings.tickSoundEnabled).toBe(false);
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(displaySpy).toHaveBeenCalledTimes(2); // Once initially, once from onChange
  });

  it("tick sound dropdown onChange updates plugin setting and saves", async () => {
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    const tickDropdownSetting = (Setting as jest.Mock).mock.instances[1];
    const dropdownCallback = tickDropdownSetting.addDropdown.mock.calls[0][0];
    const mockDropdown = {
      addOption: jest.fn(),
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb("ipsum")),
    };
    dropdownCallback(mockDropdown);

    expect(mockDropdown.addOption).toHaveBeenCalledWith("lorem", "lorem");
    expect(mockDropdown.addOption).toHaveBeenCalledWith("ipsum", "ipsum");
    expect(mockDropdown.setValue).toHaveBeenCalledWith("lorem");
    expect(plugin.settings.tickSound).toBe("ipsum");
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("tick sound volume slider onChange updates plugin setting and saves", async () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const tickSliderSetting = (Setting as jest.Mock).mock.instances[2];
    const sliderCallback = tickSliderSetting.addSlider.mock.calls[0][0];
    const mockSlider = {
      setLimits: jest.fn(),
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(0.8)),
    };
    sliderCallback(mockSlider);

    expect(mockSlider.setLimits).toHaveBeenCalledWith(0, 1, 0.05);
    expect(mockSlider.setValue).toHaveBeenCalledWith(0.5);
    expect(plugin.settings.tickSoundVolume).toBe(0.8);
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("tick sound test button onClick plays tick sound if sound is selected", () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const tickButtonSetting = (Setting as jest.Mock).mock.instances[3];
    const buttonCallback = tickButtonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    expect(mockButton.setButtonText).toHaveBeenCalledWith("Play sound");

    // Simulate clicking with a selected sound
    plugin.settings.tickSound = "lorem";
    mockButton.onClick.mock.calls[0][0]();

    expect(soundManager.playTickSound).toHaveBeenCalled();
  });

  it("tick sound test button onClick warns if no sound selected", () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const tickButtonSetting = (Setting as jest.Mock).mock.instances[3];
    const buttonCallback = tickButtonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    // Simulate clicking with no selected sound
    plugin.settings.tickSound = "";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockButton.onClick.mock.calls[0][0]();

    expect(warnSpy).toHaveBeenCalledWith(
      "No sound selected, cannot play sound.",
    );
    expect(soundManager.playTickSound).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("untick sound enabled toggle starts disabled and onChange updates plugin setting, saves, and re-renders", async () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    const displaySpy = jest.spyOn(tab, "display");
    tab.display();

    const untickEnabledSetting = (Setting as jest.Mock).mock.instances[4];
    const toggleCallback = untickEnabledSetting.addToggle.mock.calls[0][0];
    const mockToggle = {
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(true)),
    };
    toggleCallback(mockToggle);

    // Should start disabled (false)
    expect(mockToggle.setValue).toHaveBeenCalledWith(false);
    // Should be enabled after onChange
    expect(plugin.settings.untickSoundEnabled).toBe(true);
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(displaySpy).toHaveBeenCalledTimes(2); // Once initially, once from onChange
  });

  it("untick sound dropdown onChange updates plugin setting and saves when untick is enabled", async () => {
    plugin.settings.untickSoundEnabled = true; // Enable untick sounds
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    const untickDropdownSetting = (Setting as jest.Mock).mock.instances[5]; // 4 tick + 1 untick toggle + 1 untick dropdown
    const dropdownCallback = untickDropdownSetting.addDropdown.mock.calls[0][0];
    const mockDropdown = {
      addOption: jest.fn(),
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb("lorem")),
    };
    dropdownCallback(mockDropdown);

    expect(mockDropdown.addOption).toHaveBeenCalledWith("lorem", "lorem");
    expect(mockDropdown.addOption).toHaveBeenCalledWith("ipsum", "ipsum");
    expect(mockDropdown.setValue).toHaveBeenCalledWith("ipsum");
    expect(plugin.settings.untickSound).toBe("lorem");
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("untick sound volume slider onChange updates plugin setting and saves when untick is enabled", async () => {
    plugin.settings.untickSoundEnabled = true; // Enable untick sounds
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const untickSliderSetting = (Setting as jest.Mock).mock.instances[6]; // 4 tick + 1 untick toggle + 1 dropdown + 1 slider
    const sliderCallback = untickSliderSetting.addSlider.mock.calls[0][0];
    const mockSlider = {
      setLimits: jest.fn(),
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(0.7)),
    };
    sliderCallback(mockSlider);

    expect(mockSlider.setLimits).toHaveBeenCalledWith(0, 1, 0.05);
    expect(mockSlider.setValue).toHaveBeenCalledWith(0.3);
    expect(plugin.settings.untickSoundVolume).toBe(0.7);
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("untick sound test button onClick plays untick sound if sound is selected when untick is enabled", () => {
    plugin.settings.untickSoundEnabled = true; // Enable untick sounds
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const untickButtonSetting = (Setting as jest.Mock).mock.instances[7]; // 4 tick + 4 untick
    const buttonCallback = untickButtonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    expect(mockButton.setButtonText).toHaveBeenCalledWith("Play sound");

    // Simulate clicking with a selected sound
    plugin.settings.untickSound = "lorem";
    mockButton.onClick.mock.calls[0][0]();

    expect(soundManager.playUntickSound).toHaveBeenCalled();
  });

  it("untick sound test button onClick warns if no sound selected when untick is enabled", () => {
    plugin.settings.untickSoundEnabled = true; // Enable untick sounds
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const untickButtonSetting = (Setting as jest.Mock).mock.instances[7]; // 4 tick + 4 untick
    const buttonCallback = untickButtonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    // Simulate clicking with no selected sound
    plugin.settings.untickSound = "";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockButton.onClick.mock.calls[0][0]();

    expect(warnSpy).toHaveBeenCalledWith(
      "No sound selected, cannot play sound.",
    );
    expect(soundManager.playUntickSound).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

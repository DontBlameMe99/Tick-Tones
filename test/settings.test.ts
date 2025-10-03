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
      untickSoundEnabled: false,
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
    expect(
      (Setting as jest.Mock).mock.instances[0].setName,
    ).toHaveBeenCalledWith("🎉 Welcome to Tick Tones!");
    expect(
      (Setting as jest.Mock).mock.instances[0].setHeading,
    ).toHaveBeenCalled();
    expect(
      (Setting as jest.Mock).mock.instances[1].setName,
    ).toHaveBeenCalledWith("Thank you for installing Tick Tones!");
    expect(
      (Setting as jest.Mock).mock.instances[1].setDesc,
    ).toHaveBeenCalledWith(
      "You're just some small steps away from unlocking the plugin's full potential.",
    );
    expect(
      (Setting as jest.Mock).mock.instances[2].setName,
    ).toHaveBeenCalledWith("To get started");
    expect(
      (Setting as jest.Mock).mock.instances[2].setHeading,
    ).toHaveBeenCalled();
    expect(
      (Setting as jest.Mock).mock.instances[3].setName,
    ).toHaveBeenCalledWith("Add your own sound files");
    expect(
      (Setting as jest.Mock).mock.instances[4].setName,
    ).toHaveBeenCalledWith("Reload the plugin");
    expect(
      (Setting as jest.Mock).mock.instances[5].setName,
    ).toHaveBeenCalledWith("Customize your settings");
    expect(
      (Setting as jest.Mock).mock.instances[6].setName,
    ).toHaveBeenCalledWith("Need help?");
    expect(
      (Setting as jest.Mock).mock.instances[6].addButton,
    ).toHaveBeenCalled();
  });

  it("renders tick settings when tick sounds are enabled and untick toggle when untick sounds are disabled", () => {
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    expect(containerEl.empty).toHaveBeenCalled();

    expect(
      (Setting as jest.Mock).mock.instances[0].setName,
    ).toHaveBeenCalledWith("Tick sound");
    expect(
      (Setting as jest.Mock).mock.instances[0].setHeading,
    ).toHaveBeenCalled();

    expect(
      (Setting as jest.Mock).mock.instances[1].setName,
    ).toHaveBeenCalledWith("Tick sound enabled");
    expect(
      (Setting as jest.Mock).mock.instances[1].addToggle,
    ).toHaveBeenCalled();

    expect(
      (Setting as jest.Mock).mock.instances[2].setName,
    ).toHaveBeenCalledWith("Tick sound");
    expect(
      (Setting as jest.Mock).mock.instances[2].addDropdown,
    ).toHaveBeenCalled();

    expect(
      (Setting as jest.Mock).mock.instances[3].setName,
    ).toHaveBeenCalledWith("Tick sound volume");
    expect(
      (Setting as jest.Mock).mock.instances[3].addSlider,
    ).toHaveBeenCalled();

    expect(
      (Setting as jest.Mock).mock.instances[4].setName,
    ).toHaveBeenCalledWith("Test tick sound");
    expect(
      (Setting as jest.Mock).mock.instances[4].addButton,
    ).toHaveBeenCalled();

    expect(
      (Setting as jest.Mock).mock.instances[5].setName,
    ).toHaveBeenCalledWith("Untick sound");
    expect(
      (Setting as jest.Mock).mock.instances[5].setHeading,
    ).toHaveBeenCalled();

    expect(
      (Setting as jest.Mock).mock.instances[6].setName,
    ).toHaveBeenCalledWith("Untick sound enabled");
    expect(
      (Setting as jest.Mock).mock.instances[6].addToggle,
    ).toHaveBeenCalled();
  });

  it("renders all settings when both tick and untick sounds are enabled", () => {
    plugin.settings.untickSoundEnabled = true;
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    expect(
      (Setting as jest.Mock).mock.instances[0].setName,
    ).toHaveBeenCalledWith("Tick sound");
    expect(
      (Setting as jest.Mock).mock.instances[5].setName,
    ).toHaveBeenCalledWith("Untick sound");

    const setNames = (Setting as jest.Mock).mock.instances.map(
      (inst) => inst.setName.mock.calls[0]?.[0],
    );

    expect(setNames).toContain("Sounds");
    expect(setNames).toContain("Reload");
  });

  it("renders only toggles when both tick and untick sounds are disabled", () => {
    plugin.settings.tickSoundEnabled = false;
    plugin.settings.untickSoundEnabled = false;
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    expect(
      (Setting as jest.Mock).mock.instances[0].setName,
    ).toHaveBeenCalledWith("Tick sound");
    expect(
      (Setting as jest.Mock).mock.instances[1].setName,
    ).toHaveBeenCalledWith("Tick sound enabled");
    expect(
      (Setting as jest.Mock).mock.instances[2].setName,
    ).toHaveBeenCalledWith("Untick sound");
    expect(
      (Setting as jest.Mock).mock.instances[3].setName,
    ).toHaveBeenCalledWith("Untick sound enabled");
    expect(
      (Setting as jest.Mock).mock.instances[4].setName,
    ).toHaveBeenCalledWith("Sounds");
    expect(
      (Setting as jest.Mock).mock.instances[5].setName,
    ).toHaveBeenCalledWith("Reload");
  });

  it("tick sound enabled toggle onChange updates plugin setting, saves, and re-renders", async () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    const displaySpy = jest.spyOn(tab, "display");
    tab.display();

    const tickEnabledSetting = (Setting as jest.Mock).mock.instances[1];
    const toggleCallback = tickEnabledSetting.addToggle.mock.calls[0][0];
    const mockToggle = {
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(false)),
    };
    toggleCallback(mockToggle);

    expect(mockToggle.setValue).toHaveBeenCalledWith(true);
    expect(plugin.settings.tickSoundEnabled).toBe(false);
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(displaySpy).toHaveBeenCalledTimes(2);
  });

  it("tick sound dropdown onChange updates plugin setting and saves", async () => {
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    const tickDropdownSetting = (Setting as jest.Mock).mock.instances[2];
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

    const tickSliderSetting = (Setting as jest.Mock).mock.instances[3];
    const sliderCallback = tickSliderSetting.addSlider.mock.calls[0][0];
    const mockSlider = {
      setLimits: jest.fn(),
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(80)),
      setDynamicTooltip: jest.fn(),
    };
    sliderCallback(mockSlider);

    expect(mockSlider.setLimits).toHaveBeenCalledWith(1, 100, 1);
    expect(mockSlider.setValue).toHaveBeenCalledWith(50);
    expect(plugin.settings.tickSoundVolume).toBe(0.8);
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("tick sound test button onClick plays tick sound if sound is selected", () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const tickButtonSetting = (Setting as jest.Mock).mock.instances[4];
    const buttonCallback = tickButtonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    expect(mockButton.setButtonText).toHaveBeenCalledWith("Play sound");

    plugin.settings.tickSound = "lorem";
    mockButton.onClick.mock.calls[0][0]();

    expect(soundManager.playTickSound).toHaveBeenCalled();
  });

  it("tick sound test button onClick warns if no sound selected", () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const tickButtonSetting = (Setting as jest.Mock).mock.instances[4];
    const buttonCallback = tickButtonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

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

    const untickEnabledSetting = (Setting as jest.Mock).mock.instances[6];
    const toggleCallback = untickEnabledSetting.addToggle.mock.calls[0][0];
    const mockToggle = {
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(true)),
    };
    toggleCallback(mockToggle);

    expect(mockToggle.setValue).toHaveBeenCalledWith(false);
    expect(plugin.settings.untickSoundEnabled).toBe(true);
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(displaySpy).toHaveBeenCalledTimes(2);
  });

  it("untick sound dropdown onChange updates plugin setting and saves when untick is enabled", async () => {
    plugin.settings.untickSoundEnabled = true;
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    const untickDropdownSetting = (Setting as jest.Mock).mock.instances[7];
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
    plugin.settings.untickSoundEnabled = true;
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const untickSliderSetting = (Setting as jest.Mock).mock.instances[8];
    const sliderCallback = untickSliderSetting.addSlider.mock.calls[0][0];
    const mockSlider = {
      setLimits: jest.fn(),
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(70)),
      setDynamicTooltip: jest.fn(),
    };
    sliderCallback(mockSlider);

    expect(mockSlider.setLimits).toHaveBeenCalledWith(1, 100, 1);
    expect(mockSlider.setValue).toHaveBeenCalledWith(30);
    expect(plugin.settings.untickSoundVolume).toBe(0.7);
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("untick sound test button onClick plays untick sound if sound is selected when untick is enabled", () => {
    plugin.settings.untickSoundEnabled = true;
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const untickButtonSetting = (Setting as jest.Mock).mock.instances[9];
    const buttonCallback = untickButtonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    expect(mockButton.setButtonText).toHaveBeenCalledWith("Play sound");

    plugin.settings.untickSound = "lorem";
    mockButton.onClick.mock.calls[0][0]();

    expect(soundManager.playUntickSound).toHaveBeenCalled();
  });

  it("untick sound test button onClick warns if no sound selected when untick is enabled", () => {
    plugin.settings.untickSoundEnabled = true;
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const untickButtonSetting = (Setting as jest.Mock).mock.instances[9];
    const buttonCallback = untickButtonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    plugin.settings.untickSound = "";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockButton.onClick.mock.calls[0][0]();

    expect(warnSpy).toHaveBeenCalledWith(
      "No sound selected, cannot play sound.",
    );
    expect(soundManager.playUntickSound).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("renders reload sounds section", () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();
    const reloadHeadingSetting = (Setting as jest.Mock).mock.instances[
      (Setting as jest.Mock).mock.instances.length - 2
    ];
    expect(reloadHeadingSetting.setName).toHaveBeenCalledWith("Sounds");
    expect(reloadHeadingSetting.setHeading).toHaveBeenCalled();
    const reloadButtonSetting = (Setting as jest.Mock).mock.instances[
      (Setting as jest.Mock).mock.instances.length - 1
    ];
    expect(reloadButtonSetting.setName).toHaveBeenCalledWith("Reload");
    expect(reloadButtonSetting.addButton).toHaveBeenCalled();
  });
});

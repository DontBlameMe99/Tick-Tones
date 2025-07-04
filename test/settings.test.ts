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
      soundSetting: "ding",
      soundVolume: 0.5,
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

  it("renders all settings when sounds are found", () => {
    soundManager.getSounds.mockReturnValue(["lorem", "ipsum"]);
    tab.display();

    expect(containerEl.empty).toHaveBeenCalled();

    // Should create three Setting instances
    expect((Setting as jest.Mock).mock.calls.length).toBe(3);

    // Dropdown
    const dropdownSetting = (Setting as jest.Mock).mock.instances[0];
    expect(dropdownSetting.setName).toHaveBeenCalledWith("Checkbox tick sound");
    expect(dropdownSetting.setDesc).toHaveBeenCalledWith(
      "Select a sound to play when a checkbox is ticked.",
    );
    expect(dropdownSetting.addDropdown).toHaveBeenCalled();

    // Slider
    const sliderSetting = (Setting as jest.Mock).mock.instances[1];
    expect(sliderSetting.setName).toHaveBeenCalledWith(
      "Modify tick sound volume",
    );
    expect(sliderSetting.setDesc).toHaveBeenCalledWith(
      "Adjust the volume of the tick sound.",
    );
    expect(sliderSetting.addSlider).toHaveBeenCalled();

    // Button
    const buttonSetting = (Setting as jest.Mock).mock.instances[2];
    expect(buttonSetting.setName).toHaveBeenCalledWith("Test selected sound");
    expect(buttonSetting.setDesc).toHaveBeenCalledWith(
      "Click to play the currently selected sound.",
    );
    expect(buttonSetting.addButton).toHaveBeenCalled();
  });

  it("dropdown onChange updates plugin setting and saves", async () => {
    soundManager.getSounds.mockReturnValue(["ding", "bloop"]);
    tab.display();

    const dropdownSetting = (Setting as jest.Mock).mock.instances[0];
    const dropdownCallback = dropdownSetting.addDropdown.mock.calls[0][0];
    const mockDropdown = {
      addOption: jest.fn(),
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb("bloop")),
    };
    dropdownCallback(mockDropdown);

    expect(mockDropdown.addOption).toHaveBeenCalledWith("ding", "ding");
    expect(mockDropdown.addOption).toHaveBeenCalledWith("bloop", "bloop");
    expect(mockDropdown.setValue).toHaveBeenCalledWith("ding");

    // Simulate user changing dropdown
    expect(plugin.settings.soundSetting).toBe("bloop");
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("slider onChange updates plugin setting and saves", async () => {
    soundManager.getSounds.mockReturnValue(["ding"]);
    tab.display();

    const sliderSetting = (Setting as jest.Mock).mock.instances[1];
    const sliderCallback = sliderSetting.addSlider.mock.calls[0][0];
    const mockSlider = {
      setLimits: jest.fn(),
      setValue: jest.fn(),
      onChange: jest.fn((cb) => cb(0.8)),
    };
    sliderCallback(mockSlider);

    expect(mockSlider.setLimits).toHaveBeenCalledWith(0, 1, 0.05);
    expect(mockSlider.setValue).toHaveBeenCalledWith(0.5);

    // Simulate user changing slider
    expect(plugin.settings.soundVolume).toBe(0.8);
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("button onClick plays sound if selected", () => {
    soundManager.getSounds.mockReturnValue(["ding"]);
    tab.display();

    const buttonSetting = (Setting as jest.Mock).mock.instances[2];
    const buttonCallback = buttonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    // Simulate clicking with a selected sound
    plugin.settings.soundSetting = "lorem";
    // Simulate the onClick handler
    mockButton.onClick.mock.calls[0][0]();

    expect(soundManager.playSound).toHaveBeenCalledWith("lorem");
  });

  it("button onClick warns if no sound selected", () => {
    soundManager.getSounds.mockReturnValue(["lorem"]);
    tab.display();

    const buttonSetting = (Setting as jest.Mock).mock.instances[2];
    const buttonCallback = buttonSetting.addButton.mock.calls[0][0];
    const mockButton = {
      setButtonText: jest.fn(),
      onClick: jest.fn(),
    };
    buttonCallback(mockButton);

    // Simulate clicking with no selected sound
    plugin.settings.soundSetting = "";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockButton.onClick.mock.calls[0][0]();
    expect(warnSpy).toHaveBeenCalledWith(
      "No sound selected, cannot play sound.",
    );
    warnSpy.mockRestore();
  });
});

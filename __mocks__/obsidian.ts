export const App = jest.fn();
export const Vault = jest.fn();
export const Notice = jest.fn();
export const normalizePath = jest.fn((p: string) => p.replace(/\/+/g, "/"));
export const settingInstances: any[] = [];

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any = {};
  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }
}

export const Setting = jest.fn().mockImplementation(() => {
  const instance: any = {};
  instance.setName = jest.fn().mockReturnValue(instance);
  instance.setDesc = jest.fn().mockReturnValue(instance);
  instance.setHeading = jest.fn().mockReturnValue(instance);
  instance.addDropdown = jest.fn().mockReturnValue(instance);
  instance.addSlider = jest.fn().mockImplementation((cb) => {
    const mockSlider = {
      setLimits: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
      setDynamicTooltip: jest.fn().mockReturnThis(),
    };

    if (cb) {
      cb(mockSlider);
    }

    return instance;
  });
  instance.addButton = jest.fn().mockReturnValue(instance);
  instance.addToggle = jest.fn().mockReturnValue(instance);
  settingInstances.push(instance);
  return instance;
});

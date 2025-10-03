export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any = {};
  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }
}

export const Setting = jest.fn().mockImplementation(function (this: any) {
  this.setName = jest.fn().mockReturnThis();
  this.setDesc = jest.fn().mockReturnThis();
  this.setHeading = jest.fn().mockReturnThis();
  this.addDropdown = jest.fn().mockReturnThis();
  this.addSlider = jest.fn().mockImplementation((cb) => {
    const mockSlider = {
      setLimits: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
      setDynamicTooltip: jest.fn().mockReturnThis(),
    };

    if (cb) {
      cb(mockSlider);
    }

    return this;
  });
  this.addButton = jest.fn().mockReturnThis();
  this.addToggle = jest.fn().mockReturnThis();
});

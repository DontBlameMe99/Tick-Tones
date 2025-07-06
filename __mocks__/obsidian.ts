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
  this.addDropdown = jest.fn().mockReturnThis();
  this.addSlider = jest.fn().mockReturnThis();
  this.addButton = jest.fn().mockReturnThis();
  this.addToggle = jest.fn().mockReturnThis();
});

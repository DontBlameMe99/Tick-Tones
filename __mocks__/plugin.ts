export function createMockPlugin(settings = {}) {
  return {
    settings,
    saveSettings: jest.fn(),
  };
}

export function createMockContainerEl() {
  return {
    empty: jest.fn(),
    createEl: jest.fn(),
  };
}

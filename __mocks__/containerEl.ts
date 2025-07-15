export function createMockContainerEl() {
  const el = {
    empty: jest.fn(),
    createEl: jest.fn((tag: string, _attrs?: any) => {
      if (tag === "ul") {
        return {
          createEl: jest.fn(),
        };
      }
      if (tag === "li") {
        return {};
      }

      if (tag === "p") {
        return {
          appendText: jest.fn(),
          createEl: jest.fn(),
        };
      }
      return {};
    }),
  };
  return el;
}

export function createMockSoundManager(sounds: string[] = []) {
  return {
    getSounds: jest.fn(() => sounds),
    playSound: jest.fn(),
    playTickSound: jest.fn(),
    playUntickSound: jest.fn(),
  };
}

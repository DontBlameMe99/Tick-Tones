import { beforeEach, describe, expect, it, jest } from 'bun:test'
import { SoundLoader } from 'src/soundLoader'

// Helper for btoa in Node
describe('SoundLoader', () => {
  let app: any
  let vault: any
  let adapter: any

  beforeEach(() => {
    adapter = {
      exists: jest.fn(),
      list: jest.fn(),
      readBinary: jest.fn(),
    }
    vault = { adapter }
    app = { vault }
  })

  it('returns empty object if assets folder does not exist', async () => {
    // Turn off console.error
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    adapter.exists.mockResolvedValue(false)

    const loader = new SoundLoader(app, '/plugins/my-plugin')
    const sounds = await loader.loadSounds()

    expect(adapter.exists).toHaveBeenCalledWith('/plugins/my-plugin/assets')
    expect(sounds).toEqual({})
    errorSpy.mockRestore()
  })

  it('returns empty object if assets folder exists but has no files', async () => {
    adapter.exists.mockResolvedValue(true)
    adapter.list.mockResolvedValue({ files: [] })

    const loader = new SoundLoader(app, '/plugins/my-plugin')
    const sounds = await loader.loadSounds()

    expect(adapter.list).toHaveBeenCalledWith('/plugins/my-plugin/assets')
    expect(sounds).toEqual({})
  })

  it('loads only supported audio files and encodes as base64', async () => {
    adapter.exists.mockResolvedValue(true)
    adapter.list.mockResolvedValue({
      files: [
        '/plugins/my-plugin/assets/ding.mp3',
        '/plugins/my-plugin/assets/bloop.wav',
        '/plugins/my-plugin/assets/readme.txt', // unsupported
        '/plugins/my-plugin/assets/sound.ogg',
      ],
    })

    // Mock readBinary for each file
    adapter.readBinary
      .mockResolvedValueOnce([100, 105, 110, 103]) // "ding"
      .mockResolvedValueOnce([98, 108, 111, 111, 112]) // "bloop"
      .mockResolvedValueOnce([115, 111, 117, 110, 100]) // "sound"

    const loader = new SoundLoader(app, '/plugins/my-plugin')
    const sounds = await loader.loadSounds()

    // Validate keys and values
    expect(Object.keys(sounds).sort()).toEqual(['bloop', 'ding', 'sound'])
    expect(sounds.ding).toMatch(/^data:audio\/mpeg;base64,/)
    expect(sounds.bloop).toMatch(/^data:audio\/wav;base64,/)
    expect(sounds.sound).toMatch(/^data:audio\/ogg;base64,/)

    // Validate actual base64 content
    const base64ForDing = Buffer.from('ding', 'binary').toString('base64')
    expect(sounds.ding).toContain(base64ForDing)
  })

  it('skips unsupported file extensions', async () => {
    adapter.exists.mockResolvedValue(true)
    adapter.list.mockResolvedValue({
      files: ['/plugins/my-plugin/assets/ignore.txt', '/plugins/my-plugin/assets/keep.mp3'],
    })
    adapter.readBinary.mockResolvedValue([107, 101, 101, 112]) // "keep"

    const loader = new SoundLoader(app, '/plugins/my-plugin')
    const sounds = await loader.loadSounds()

    expect(Object.keys(sounds)).toEqual(['keep'])
    expect(sounds.keep).toMatch(/^data:audio\/mpeg;base64,/)
  })

  it('encodes bytes in the 128-255 range correctly', async () => {
    adapter.exists.mockResolvedValue(true)
    adapter.list.mockResolvedValue({
      files: ['/plugins/my-plugin/assets/high.wav'],
    })
    // Bytes 128-255 in sequence — the range where TextDecoder('latin1') differs
    const highBytes = Array.from({ length: 128 }, (_, i) => i + 128)
    adapter.readBinary.mockResolvedValue(highBytes)

    const loader = new SoundLoader(app, '/plugins/my-plugin')
    const sounds = await loader.loadSounds()

    const uri = sounds.high
    expect(uri).toBeDefined()
    const base64 = uri!.split(',')[1]
    const decoded = Buffer.from(base64, 'base64')
    expect(Array.from(decoded)).toEqual(highBytes)
  })

  it('encodes all 256 byte values exactly', async () => {
    adapter.exists.mockResolvedValue(true)
    adapter.list.mockResolvedValue({
      files: ['/plugins/my-plugin/assets/full.wav'],
    })
    const allBytes = Array.from({ length: 256 }, (_, i) => i)
    adapter.readBinary.mockResolvedValue(allBytes)

    const loader = new SoundLoader(app, '/plugins/my-plugin')
    const sounds = await loader.loadSounds()

    const base64 = sounds.full.split(',')[1]
    expect(Array.from(Buffer.from(base64, 'base64'))).toEqual(allBytes)
  })

  it('encodes multiple chunks exactly without Buffer', async () => {
    adapter.exists.mockResolvedValue(true)
    adapter.list.mockResolvedValue({
      files: ['/plugins/my-plugin/assets/large.wav'],
    })
    const bytes = Array.from({ length: 60_000 }, (_, i) => (i * 37) & 0xff)
    adapter.readBinary.mockResolvedValue(bytes)

    const loader = new SoundLoader(app, '/plugins/my-plugin')
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Buffer')
    let sounds!: Record<string, string>
    Object.defineProperty(globalThis, 'Buffer', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    try {
      sounds = await loader.loadSounds()
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'Buffer', descriptor)
      } else {
        Reflect.deleteProperty(globalThis, 'Buffer')
      }
    }

    const base64 = sounds.large.split(',')[1]
    expect(Array.from(Buffer.from(base64, 'base64'))).toEqual(bytes)
  })

  it('handles errors gracefully and returns empty object', async () => {
    // Turn off console.error
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    adapter.exists.mockRejectedValue(new Error('adapter error'))

    const loader = new SoundLoader(app, '/plugins/my-plugin')
    const sounds = await loader.loadSounds()

    expect(sounds).toEqual({})
    errorSpy.mockRestore()
  })
})

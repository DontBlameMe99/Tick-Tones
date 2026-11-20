import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test'
import type { App } from 'obsidian'
import type { SoundManager as SoundManagerType } from '../src/soundManager'
import { DEFAULT_SETTINGS } from '../src/types'

const mockHowlInstance = {
  volume: jest.fn(),
  play: jest.fn(),
  unload: jest.fn(),
}

mock.module('howler', () => ({
  Howl: jest.fn(() => mockHowlInstance),
}))

const { SoundManager: SoundManagerClass } = await import('../src/soundManager')
const { SoundLoader } = await import('../src/soundLoader')
const { Howl } = await import('howler')
const HowlMock = Howl as unknown as jest.Mock

describe('SoundManager', () => {
  let app: App
  let settings: typeof DEFAULT_SETTINGS
  let soundManager: SoundManagerType
  let mockLoadSounds: jest.Mock
  let loadSoundsSpy: ReturnType<typeof jest.spyOn>
  let consoleWarnSpy: ReturnType<typeof jest.spyOn>
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>

  beforeEach(() => {
    jest.clearAllMocks()

    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    app = {} as App
    settings = { ...DEFAULT_SETTINGS }

    mockLoadSounds = jest.fn().mockResolvedValue({})
    loadSoundsSpy = jest
      .spyOn(SoundLoader.prototype, 'loadSounds')
      .mockImplementation(mockLoadSounds)

    soundManager = new SoundManagerClass(app, settings, '/fake/path')
    HowlMock.mockClear()
    mockHowlInstance.volume.mockClear()
    mockHowlInstance.play.mockClear()
    mockHowlInstance.unload.mockClear()
  })

  afterEach(() => {
    loadSoundsSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('init', () => {
    it('loads sounds via SoundLoader', async () => {
      mockLoadSounds.mockResolvedValue({
        lorem: 'data:audio/mp3;base64,lorem',
        ipsum: 'data: audio/wav;base64,ipsum',
      })

      await soundManager.init()

      expect(mockLoadSounds).toHaveBeenCalled()
      expect(soundManager.getSounds()).toEqual(['lorem', 'ipsum'])
    })
  })

  describe('playSound', () => {
    beforeEach(async () => {
      mockLoadSounds.mockResolvedValue({
        lorem: 'data:audio/mp3;base64,lorem',
        ipsum: 'data:audio/wav;base64,ipsum',
      })
      await soundManager.init()
    })

    it('does nothing if no sounds are loaded', async () => {
      const emptySoundManager = new SoundManagerClass(app, { ...DEFAULT_SETTINGS }, '/fake/path')
      mockLoadSounds.mockResolvedValue({})
      await emptySoundManager.init()

      await emptySoundManager.playSound('lorem', 0.5)

      expect(consoleWarnSpy).toHaveBeenCalledWith('No sounds found.  Aborting.')
    })

    it('logs error if sound not found', async () => {
      await soundManager.playSound('nonexistent', 0.5)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Sound "nonexistent" not found.')
    })

    it('creates a new Howl instance if not cached', async () => {
      await soundManager.playSound('lorem', 0.5)

      expect(HowlMock).toHaveBeenCalledWith({
        src: ['data:audio/mp3;base64,lorem'],
        preload: true,
      })
      expect(mockHowlInstance.volume).toHaveBeenCalledWith(0.5)
      expect(mockHowlInstance.play).toHaveBeenCalled()
    })

    it('reuses cached Howl instance', async () => {
      await soundManager.playSound('lorem', 0.5)

      await soundManager.playSound('lorem', 0.7)
      expect(HowlMock).toHaveBeenCalledTimes(1)
      expect(mockHowlInstance.volume).toHaveBeenCalledWith(0.7)
      expect(mockHowlInstance.play).toHaveBeenCalledTimes(2)
    })

    it('skips redundant volume updates on cached Howls', async () => {
      await soundManager.playSound('lorem', 0.5)
      await soundManager.playSound('lorem', 0.5)
      await soundManager.playSound('lorem', 0.7)

      expect(mockHowlInstance.volume).toHaveBeenCalledTimes(2)
      expect(mockHowlInstance.play).toHaveBeenCalledTimes(3)
    })
  })

  describe('playTickSound', () => {
    beforeEach(async () => {
      mockLoadSounds.mockResolvedValue({
        lorem: 'data:audio/mp3;base64,lorem',
        ipsum: 'data:audio/wav;base64,ipsum',
        dolor: 'data:audio/wav;base64,dolor',
      })
      await soundManager.init()
    })

    it('does nothing if tickSoundEnabled is false', async () => {
      settings.tickSoundEnabled = false
      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound')
      await soundManager.playTickSound()
      expect(playSoundSpy).not.toHaveBeenCalled()
    })

    it('calls playSound with tickSound and tickSoundVolume when random is disabled', async () => {
      settings.tickSoundEnabled = true
      settings.tickSound = 'lorem'
      settings.tickSoundVolume = 0.7
      settings.useRandomTickSound = false

      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound').mockResolvedValue(undefined)
      await soundManager.playTickSound()
      expect(playSoundSpy).toHaveBeenCalledWith('lorem', 0.7)
    })

    it('calls playSound with random sound from tickSounds when random is enabled', async () => {
      settings.tickSoundEnabled = true
      settings.useRandomTickSound = true
      settings.tickSounds = ['lorem', 'ipsum', 'dolor']
      settings.tickSoundVolume = 0.8

      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound').mockResolvedValue(undefined)

      await soundManager.playTickSound()

      expect(playSoundSpy).toHaveBeenCalledTimes(1)
      expect(playSoundSpy).toHaveBeenCalledWith(expect.stringMatching(/^(lorem|ipsum|dolor)$/), 0.8)
    })

    it('does nothing when random is enabled but tickSounds is empty', async () => {
      settings.tickSoundEnabled = true
      settings.useRandomTickSound = true
      settings.tickSounds = []
      settings.tickSound = 'lorem'
      settings.tickSoundVolume = 0.7

      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound').mockResolvedValue(undefined)

      await soundManager.playTickSound()

      expect(consoleWarnSpy).toHaveBeenCalledWith('No random sound available, playing nothing.')
      expect(playSoundSpy).not.toHaveBeenCalled()
    })

    it('plays different sounds on multiple calls when random is enabled', async () => {
      settings.tickSoundEnabled = true
      settings.useRandomTickSound = true
      settings.tickSounds = ['lorem', 'ipsum', 'dolor']
      settings.tickSoundVolume = 0.5

      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound').mockResolvedValue(undefined)

      const playedSounds = new Set<string>()

      for (let i = 0; i < 20; i++) {
        await soundManager.playTickSound()
        const callArgs = playSoundSpy.mock.calls[i]
        playedSounds.add(callArgs[0] as string)
      }

      expect(playedSounds.size).toBeGreaterThanOrEqual(2)
    })
  })

  describe('playUntickSound', () => {
    beforeEach(async () => {
      mockLoadSounds.mockResolvedValue({
        lorem: 'data:audio/mp3;base64,lorem',
        ipsum: 'data:audio/wav;base64,ipsum',
        dolor: 'data:audio/wav;base64,dolor',
      })
      await soundManager.init()
    })

    it('does nothing if untickSoundEnabled is false', async () => {
      settings.untickSoundEnabled = false
      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound')
      await soundManager.playUntickSound()
      expect(playSoundSpy).not.toHaveBeenCalled()
    })

    it('calls playSound with untickSound and untickSoundVolume when random is disabled', async () => {
      settings.untickSoundEnabled = true
      settings.untickSound = 'ipsum'
      settings.untickSoundVolume = 0.6
      settings.useRandomUntickSound = false

      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound').mockResolvedValue(undefined)
      await soundManager.playUntickSound()
      expect(playSoundSpy).toHaveBeenCalledWith('ipsum', 0.6)
    })

    it('calls playSound with random sound from untickSounds when random is enabled', async () => {
      settings.untickSoundEnabled = true
      settings.useRandomUntickSound = true
      settings.untickSounds = ['lorem', 'ipsum']
      settings.untickSoundVolume = 0.9

      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound').mockResolvedValue(undefined)

      await soundManager.playUntickSound()

      expect(playSoundSpy).toHaveBeenCalledTimes(1)
      expect(playSoundSpy).toHaveBeenCalledWith(expect.stringMatching(/^(lorem|ipsum)$/), 0.9)
    })

    it('does nothing when random is enabled but untickSounds is empty', async () => {
      settings.untickSoundEnabled = true
      settings.useRandomUntickSound = true
      settings.untickSounds = []
      settings.untickSound = 'ipsum'
      settings.untickSoundVolume = 0.6

      const playSoundSpy = jest.spyOn(soundManager as any, 'playSound').mockResolvedValue(undefined)

      await soundManager.playUntickSound()

      expect(consoleWarnSpy).toHaveBeenCalledWith('No random sound available, playing nothing.')
      expect(playSoundSpy).not.toHaveBeenCalled()
    })
  })

  describe('getSounds', () => {
    it('returns array of sound names', async () => {
      mockLoadSounds.mockResolvedValue({
        lorem: 'data:audio/mp3;base64,lorem',
        ipsum: 'data: audio/wav;base64,ipsum',
      })
      await soundManager.init()

      expect(soundManager.getSounds()).toEqual(['lorem', 'ipsum'])
    })
  })

  describe('reloadSounds', () => {
    it('reloads sounds from SoundLoader', async () => {
      mockLoadSounds.mockResolvedValue({
        lorem: 'data:audio/mp3;base64,lorem',
      })
      await soundManager.init()

      expect(soundManager.getSounds()).toEqual(['lorem'])

      mockLoadSounds.mockResolvedValue({
        ipsum: 'data:audio/wav;base64,ipsum',
        dolor: 'data:audio/ogg;base64,dolor',
      })

      await soundManager.reloadSounds()
      expect(soundManager.getSounds()).toEqual(['ipsum', 'dolor'])
    })

    it('unloads cached Howls when sounds change', async () => {
      mockLoadSounds.mockResolvedValue({ lorem: 'data:audio/mp3;base64,lorem' })
      await soundManager.init()
      await soundManager.playSound('lorem', 0.5)

      await soundManager.reloadSounds()

      expect(mockHowlInstance.unload).toHaveBeenCalledTimes(1)
      expect(soundManager.soundCache).toEqual({})
    })
  })

  describe('unload', () => {
    it('unloads all cached Howl instances', async () => {
      mockLoadSounds.mockResolvedValue({
        lorem: 'data:audio/mp3;base64,lorem',
        ipsum: 'data:audio/wav;base64,ipsum',
      })
      await soundManager.init()

      await soundManager.playSound('lorem', 0.5)
      await soundManager.playSound('ipsum', 0.5)

      soundManager.unload()

      expect(mockHowlInstance.unload).toHaveBeenCalledTimes(2)
      expect(soundManager.soundCache).toEqual({})
    })
  })

  describe('getRandomSound', () => {
    it('returns null for empty array', () => {
      const result = soundManager.getRandomSound([])
      expect(result).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalledWith('No random sound available, playing nothing.')
    })

    it('returns the only sound in a single-element array', () => {
      const result = soundManager.getRandomSound(['single'])
      expect(result).toBe('single')
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('returns a sound from the array', () => {
      const sounds = ['lorem', 'ipsum', 'dolor']
      const result = soundManager.getRandomSound(sounds)
      expect(result).not.toBeNull()
      expect(sounds).toContain(result as string)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('returns different sounds over multiple calls', () => {
      const sounds = ['lorem', 'ipsum', 'dolor', 'sit', 'amet']
      const results = new Set<string>()

      for (let i = 0; i < 50; i++) {
        const result = soundManager.getRandomSound(sounds)
        if (result) results.add(result)
      }

      expect(results.size).toBeGreaterThanOrEqual(3)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })
})

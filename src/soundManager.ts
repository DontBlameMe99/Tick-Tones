import { Howl } from 'howler'
import { type App, Notice } from 'obsidian'
import { SoundLoader } from './soundLoader'
import type { TickTonesSettings } from './types'

export class SoundManager {
  soundCache: Record<string, Howl> = {}
  private loadedSounds: Record<string, string> = {}
  private hasSounds = false
  private soundVolumes: Record<string, number> = {}
  private soundLoader: SoundLoader
  private settings: TickTonesSettings

  constructor(app: App, settings: TickTonesSettings, pluginDir: string) {
    this.settings = settings
    this.soundLoader = new SoundLoader(app, pluginDir)
  }

  async init(): Promise<void> {
    this.loadedSounds = await this.soundLoader.loadSounds()
    this.hasSounds = Object.keys(this.loadedSounds).length > 0
  }

  playSound(sound: string, volume: number): void {
    if (!this.hasSounds) {
      console.warn('No sounds found.  Aborting.')
      return
    }

    const soundData = this.loadedSounds[sound]

    if (!soundData) {
      console.error(`Sound "${sound}" not found.`)
      return
    }

    let howl = this.soundCache[sound]

    if (!howl) {
      howl = new Howl({ src: [soundData], preload: true })
      this.soundCache[sound] = howl
    }

    if (this.soundVolumes[sound] !== volume) {
      howl.volume(volume)
      this.soundVolumes[sound] = volume
    }
    howl.play()
  }

  getRandomSound(sounds: string[]): string | null {
    if (sounds.length === 0) {
      new Notice(
        'No random sound available, please check your settings and select sound(s).',
        10 * 1000
      )
      console.warn('No random sound available, playing nothing.')
      return null
    }

    const randomIndex = Math.floor(Math.random() * sounds.length)
    return sounds[randomIndex]
  }

  public playTickSound(): void {
    if (!this.settings.tickSoundEnabled) {
      return
    }

    if (!this.settings.useRandomTickSound) {
      this.playSound(this.settings.tickSound, this.settings.tickSoundVolume)
      return
    }

    const randomSound = this.getRandomSound(this.settings.tickSounds)

    if (!randomSound) {
      return
    }

    this.playSound(randomSound, this.settings.tickSoundVolume)
  }

  public playUntickSound(): void {
    if (!this.settings.untickSoundEnabled) {
      return
    }

    if (!this.settings.useRandomUntickSound) {
      this.playSound(this.settings.untickSound, this.settings.untickSoundVolume)
      return
    }

    const randomSound = this.getRandomSound(this.settings.untickSounds)

    if (!randomSound) {
      return
    }

    this.playSound(randomSound, this.settings.untickSoundVolume)
  }

  public getSounds(): string[] {
    return Object.keys(this.loadedSounds)
  }

  private disposeSounds(): void {
    Object.values(this.soundCache).forEach((howl) => howl.unload())
    this.soundCache = {}
    this.soundVolumes = {}
  }

  public async reloadSounds(): Promise<void> {
    this.loadedSounds = await this.soundLoader.loadSounds()
    this.hasSounds = Object.keys(this.loadedSounds).length > 0
    this.disposeSounds()
  }

  public unload(): void {
    this.disposeSounds()
  }
}

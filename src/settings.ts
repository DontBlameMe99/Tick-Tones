import { mkdirSync } from 'fs'
import {
  type App,
  FileSystemAdapter,
  PluginSettingTab,
  type Setting,
  type SettingDefinitionItem,
} from 'obsidian'
import { join } from 'path'
import type TickTonesSounds from '../main'
import type { SoundManager } from './soundManager'
import type { TickTonesSettings } from './types'

const CONTROL_UPDATE_KEYS = new Set([
  'tickSoundEnabled',
  'useRandomTickSound',
  'untickSoundEnabled',
  'useRandomUntickSound',
])

type TickTonesSettingKey = keyof TickTonesSettings

export class TickTonesSettingsTab extends PluginSettingTab {
  private soundManager: SoundManager

  constructor(
    app: App,
    private plugin: TickTonesSounds,
    soundManager: SoundManager
  ) {
    super(app, plugin)
    this.soundManager = soundManager
  }

  private openSoundsFolder(): void {
    const adapter = this.plugin.app.vault.adapter
    if (adapter instanceof FileSystemAdapter) {
      const assetsPath = join(adapter.getBasePath(), this.plugin.manifest.dir!, 'assets')
      mkdirSync(assetsPath, { recursive: true })
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { shell } = require('electron')
      shell.openPath(assetsPath)
    }
  }

  public getSettingDefinitions(): SettingDefinitionItem<TickTonesSettingKey>[] {
    const sounds = this.soundManager.getSounds()
    const hasSounds = sounds.length > 0
    const soundOptions = this.buildSoundOptions(sounds)

    return [
      {
        type: 'group',
        heading: 'Get started',
        visible: !hasSounds,
        items: [
          {
            name: 'Drop your audio files into the plugin sounds folder, then reload below.',
          },
          {
            name: 'New to Tick Tones?',
            render: (setting) => {
              setting.setName('New to Tick Tones?')
              setting.setDesc('Head over to GitHub for guides and examples.')
              setting.addButton((button) => {
                button.setIcon('external-link').setTooltip('Open GitHub')
                button.onClick(() => window.open('https://github.com/DontBlameMe99/Tick-Tones'))
              })
            },
          },
        ],
      },
      {
        type: 'group',
        heading: 'Tick sound',
        visible: hasSounds,
        items: [
          {
            name: 'Enabled',
            desc: 'Play a sound when you tick a checkbox.',
            control: { type: 'toggle', key: 'tickSoundEnabled' },
          },
          {
            name: 'Random',
            desc: 'Pick from a selection of sounds each time.',
            visible: () => this.plugin.settings.tickSoundEnabled,
            control: { type: 'toggle', key: 'useRandomTickSound' },
          },
          {
            name: 'Sounds',
            desc: 'Click a sound to add or remove it from the rotation.',
            visible: () =>
              this.plugin.settings.tickSoundEnabled && this.plugin.settings.useRandomTickSound,
            render: (setting) => {
              setting.setName('Sounds')
              const selected = this.plugin.settings.tickSounds
              const updateDesc = () => {
                const count = selected.length
                setting.setDesc(
                  count > 0
                    ? `${count} selected: ${selected.join(', ')}`
                    : 'Click a sound above to add it to the rotation.'
                )
              }
              updateDesc()
              this.renderSoundList(
                setting,
                sounds,
                selected,
                'tick-sound-list',
                (sound, button) => {
                  const idx = selected.indexOf(sound)
                  if (idx >= 0) {
                    selected.splice(idx, 1)
                    button.removeClass('mod-cta')
                  } else {
                    selected.push(sound)
                    button.addClass('mod-cta')
                  }
                  this.plugin.saveSettings()
                  updateDesc()
                },
                (sound, isSelected) => `tick-sound-btn${isSelected ? ' mod-cta' : ''}`
              )
            },
          },
          {
            name: 'Single sound',
            desc: 'Pick a single sound to play on tick.',
            visible: () =>
              this.plugin.settings.tickSoundEnabled && !this.plugin.settings.useRandomTickSound,
            control: {
              type: 'dropdown',
              key: 'tickSound',
              options: soundOptions,
            },
          },
          {
            name: 'Volume',
            desc: 'How loud the tick sound plays.',
            visible: () => this.plugin.settings.tickSoundEnabled,
            control: {
              type: 'slider',
              key: 'tickSoundVolume',
              min: 1,
              max: 100,
              step: 1,
            },
          },
          {
            name: '',
            visible: () => this.plugin.settings.tickSoundEnabled,
            render: (setting) => {
              setting.addButton((button) => {
                button.setIcon('play').setTooltip('Play tick sound')
                button.onClick(() => {
                  const selectedSound = this.plugin.settings.tickSound
                  if (!selectedSound) {
                    console.warn('No sound selected, cannot play sound.')
                    return
                  }
                  this.soundManager.playTickSound().catch((err) => {
                    console.error('Failed to play tick sound.', err)
                  })
                })
              })
            },
          },
        ],
      },
      {
        type: 'group',
        heading: 'Untick sound',
        visible: hasSounds,
        items: [
          {
            name: 'Enabled',
            desc: 'Play a sound when you untick a checkbox.',
            control: { type: 'toggle', key: 'untickSoundEnabled' },
          },
          {
            name: 'Random',
            desc: 'Pick from a selection of sounds each time.',
            visible: () => this.plugin.settings.untickSoundEnabled,
            control: { type: 'toggle', key: 'useRandomUntickSound' },
          },
          {
            name: 'Sounds',
            desc: 'Click a sound to add or remove it from the rotation.',
            visible: () =>
              this.plugin.settings.untickSoundEnabled && this.plugin.settings.useRandomUntickSound,
            render: (setting) => {
              setting.setName('Sounds')
              const selected = this.plugin.settings.untickSounds
              const updateDesc = () => {
                const count = selected.length
                setting.setDesc(
                  count > 0
                    ? `${count} selected: ${selected.join(', ')}`
                    : 'Click a sound above to add it to the rotation.'
                )
              }
              updateDesc()
              this.renderSoundList(
                setting,
                sounds,
                selected,
                'untick-sound-list',
                (sound, button) => {
                  const idx = selected.indexOf(sound)
                  if (idx >= 0) {
                    selected.splice(idx, 1)
                    button.removeClass('mod-cta')
                  } else {
                    selected.push(sound)
                    button.addClass('mod-cta')
                  }
                  this.plugin.saveSettings()
                  updateDesc()
                },
                (_sound, isSelected) => (isSelected ? 'mod-cta' : '')
              )
            },
          },
          {
            name: 'Single sound',
            desc: 'Pick a single sound to play on untick.',
            visible: () =>
              this.plugin.settings.untickSoundEnabled && !this.plugin.settings.useRandomUntickSound,
            control: {
              type: 'dropdown',
              key: 'untickSound',
              options: soundOptions,
            },
          },
          {
            name: 'Volume',
            desc: 'How loud the untick sound plays.',
            visible: () => this.plugin.settings.untickSoundEnabled,
            control: {
              type: 'slider',
              key: 'untickSoundVolume',
              min: 1,
              max: 100,
              step: 1,
            },
          },
          {
            name: '',
            visible: () => this.plugin.settings.untickSoundEnabled,
            render: (setting) => {
              setting.addButton((button) => {
                button.setIcon('play').setTooltip('Play untick sound')
                button.onClick(() => {
                  const selectedSound = this.plugin.settings.untickSound
                  if (!selectedSound) {
                    console.warn('No sound selected, cannot play sound.')
                    return
                  }
                  this.soundManager.playUntickSound().catch((err) => {
                    console.error('Failed to play untick sound.', err)
                  })
                })
              })
            },
          },
        ],
      },
      {
        type: 'group',
        heading: 'Sound files',
        items: [
          {
            name: 'Open the sounds folder to add or remove audio files, then reload.',
            render: (setting) => {
              setting.addButton((button) => {
                button.setIcon('folder-open').setTooltip('Open sounds folder')
                button.onClick(() => this.openSoundsFolder())
              })
              setting.addButton((button) => {
                button.setIcon('refresh-cw').setTooltip('Reload sounds')
                button.onClick(async () => {
                  try {
                    await this.soundManager.reloadSounds()
                    this.update()
                  } catch (err) {
                    console.error('Failed to reload sounds.', err)
                  }
                })
              })
            },
          },
        ],
      },
    ]
  }

  public getControlValue(key: string): unknown {
    if (key === 'tickSoundVolume') {
      return Math.round(this.plugin.settings.tickSoundVolume * 100)
    }
    if (key === 'untickSoundVolume') {
      return Math.round(this.plugin.settings.untickSoundVolume * 100)
    }
    return this.plugin.settings[key as TickTonesSettingKey]
  }

  public setControlValue(key: string, value: unknown): void {
    if (key === 'tickSoundVolume') {
      this.plugin.settings.tickSoundVolume = Number(value) / 100
    } else if (key === 'untickSoundVolume') {
      this.plugin.settings.untickSoundVolume = Number(value) / 100
    } else {
      const settings = this.plugin.settings as Record<
        TickTonesSettingKey,
        TickTonesSettings[TickTonesSettingKey]
      >
      settings[key as TickTonesSettingKey] = value as TickTonesSettings[TickTonesSettingKey]
    }

    this.plugin.saveSettings()

    if (CONTROL_UPDATE_KEYS.has(key)) {
      this.update()
    } else {
      this.refreshDomState()
    }
  }

  private buildSoundOptions(sounds: string[]): Record<string, string> {
    return sounds.reduce<Record<string, string>>((options, sound) => {
      options[sound] = sound
      return options
    }, {})
  }

  private renderSoundList(
    setting: Setting,
    sounds: string[],
    selectedSounds: string[],
    listClass: string,
    onToggle: (sound: string, button: HTMLButtonElement) => void,
    getButtonClass: (sound: string, isSelected: boolean) => string
  ) {
    setting.controlEl.empty()
    const list = setting.controlEl.createDiv(listClass)

    sounds.forEach((sound) => {
      const isSelected = selectedSounds.includes(sound)
      const button = list.createEl('button', {
        text: sound,
        cls: getButtonClass(sound, isSelected),
      })

      button.onclick = () => {
        onToggle(sound, button)
      }
    })
  }
}

import {
  type App,
  FileSystemAdapter,
  Notice,
  normalizePath,
  PluginSettingTab,
  requestUrl,
  type Setting,
  type SettingDefinitionItem,
} from 'obsidian'
import type TickTonesSounds from '../main'
import type { SoundManager } from './soundManager'
import type { TickTonesSettings } from './types'

const SAMPLE_SOUNDS: Array<{ name: string; url: string }> = [
  {
    name: 'Microsoft_ToDo.wav',
    url: 'https://raw.githubusercontent.com/DontBlameMeDev/Tick-Tones/master/assets/Microsoft_ToDo.wav',
  },
  {
    name: 'Task_Completed.wav',
    url: 'https://raw.githubusercontent.com/DontBlameMeDev/Tick-Tones/master/assets/Task_Completed.wav',
  },
]

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
      const assetsPath = normalizePath(
        `${adapter.getBasePath()}/${this.plugin.manifest.dir}/assets`
      )
      this.plugin.app.vault.adapter.mkdir(assetsPath).catch(() => {})
      require('electron').shell.openPath(assetsPath)
    }
  }

  private async downloadSampleSounds(): Promise<void> {
    const adapter = this.plugin.app.vault.adapter
    const assetsPath = normalizePath(`${this.plugin.manifest.dir}/assets`)

    try {
      await adapter.mkdir(assetsPath)
    } catch {
      // folder already exists
    }

    const results = await Promise.allSettled(
      SAMPLE_SOUNDS.map(async (sound) => {
        const response = await requestUrl(sound.url)
        if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
        const buffer = response.arrayBuffer
        const filePath = normalizePath(`${assetsPath}/${sound.name}`)
        await adapter.writeBinary(filePath, buffer)
      })
    )

    const downloaded = results.filter((r) => r.status === 'fulfilled').length
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'rejected') {
        console.error(`Failed to download sample sound: ${SAMPLE_SOUNDS[i].name}`, result.reason)
        new Notice(`Failed to download ${SAMPLE_SOUNDS[i].name}`)
      }
    }

    new Notice(`Downloaded ${downloaded} sample sound${downloaded === 1 ? '' : 's'}.`)
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
            name: '',
            render: (setting) => {
              setting.setName('Download sample sounds')
              setting.setDesc('Get started with pre-made sounds.')
              setting.addButton((button) => {
                button
                  .setIcon('download')
                  .setTooltip('Download sample sounds')
                  .onClick(async () => {
                    await this.downloadSampleSounds()
                    await this.soundManager.reloadSounds()
                    this.update()
                  })
              })
            },
          },
          {
            name: 'New to Tick Tones?',
            render: (setting) => {
              setting.setName('New to Tick Tones?')
              setting.setDesc('Head over to GitHub for guides and examples.')
              setting.addButton((button) => {
                button.setIcon('external-link').setTooltip('Open GitHub')
                button.onClick(() => window.open('https://github.com/DontBlameMeDev/Tick-Tones'))
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
                (_sound, isSelected) => `tick-sound-btn${isSelected ? ' mod-cta' : ''}`
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
              setting.setName('Preview')
              setting.setDesc('Play the current tick sound to test it.')
              setting.addButton((button) => {
                button.setIcon('play').setTooltip('Play tick sound')
                button.onClick(() => {
                  this.soundManager.playTickSound()
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
              setting.setName('Preview')
              setting.setDesc('Play the current untick sound to test it.')
              setting.addButton((button) => {
                button.setIcon('play').setTooltip('Play untick sound')
                button.onClick(() => {
                  this.soundManager.playUntickSound()
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
                  button.setDisabled(true)
                  button.setIcon('loader')
                  try {
                    await this.soundManager.reloadSounds()
                    this.update()
                  } catch (err) {
                    console.error('Failed to reload sounds.', err)
                  } finally {
                    button.setDisabled(false)
                    button.setIcon('refresh-cw')
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

    this.refreshDomState()
  }

  private buildSoundOptions(sounds: string[]): Record<string, string> {
    return Object.fromEntries(sounds.map((s) => [s, s]))
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
    const selected = new Set(selectedSounds)
    sounds.forEach((sound) => {
      const isSelected = selected.has(sound)
      const button = list.createEl('button', {
        text: sound,
        cls: getButtonClass(sound, isSelected),
      })

      const toggle = () => onToggle(sound, button)

      button.onclick = toggle
      button.onkeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }
    })
  }
}

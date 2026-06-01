import { App, PluginSettingTab, type Setting, type SettingDefinitionItem } from 'obsidian'
import TickTonesSounds from '../main'
import { SoundManager } from './soundManager'
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

  public getSettingDefinitions(): SettingDefinitionItem<TickTonesSettingKey>[] {
    const sounds = this.soundManager.getSounds()
    const hasSounds = sounds.length > 0
    const soundOptions = this.buildSoundOptions(sounds)
    const tickSoundCount = this.plugin.settings.tickSounds.length
    const untickSoundCount = this.plugin.settings.untickSounds.length

    return [
      {
        type: 'group',
        heading: '🎉 Welcome!',
        visible: !hasSounds,
        items: [
          {
            name: 'Thank you for installing!',
            desc: "You're just some small steps away from unlocking the plugin's full potential.",
          },
        ],
      },
      {
        type: 'group',
        heading: 'To get started',
        visible: !hasSounds,
        items: [
          {
            name: 'Add your own sound files',
            desc: "Add your own sound files to the plugin's sounds folder.",
          },
          {
            name: 'Reload the plugin',
            desc: "Reload the plugin or use the Reload button below once you've added sounds.",
          },
          {
            name: 'Customize your settings',
            desc: 'Customize your settings and enjoy!',
          },
          {
            name: 'Need help?',
            desc: 'See the GitHub page for instructions & examples.',
            render: (setting) => {
              setting.setName('Need help?')
              setting.setDesc('See the GitHub page for instructions & examples.')
              setting.addButton((button) => {
                button.setButtonText('Open GitHub')
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
            name: 'Tick sound enabled',
            desc: 'Toggle if a sound should be played when a checkbox is ticked.',
            control: { type: 'toggle', key: 'tickSoundEnabled' },
          },
          {
            name: 'Use random tick sound',
            desc: 'Play a random sound from a list when checkbox is ticked.',
            visible: () => this.plugin.settings.tickSoundEnabled,
            control: { type: 'toggle', key: 'useRandomTickSound' },
          },
          {
            name: 'Random tick sounds',
            desc:
              'Select sounds to include in the random selection. Click a sound to add/remove it from the list.',
            visible: () =>
              this.plugin.settings.tickSoundEnabled && this.plugin.settings.useRandomTickSound,
            render: (setting) => {
              setting.setName('Random tick sounds')
              setting.setDesc(
                'Select sounds to include in the random selection. Click a sound to add/remove it from the list.'
              )
              this.renderSoundList(
                setting,
                sounds,
                this.plugin.settings.tickSounds,
                'tick-sound-list',
                (sound, isSelected) => {
                  if (isSelected) {
                    this.plugin.settings.tickSounds = this.plugin.settings.tickSounds.filter(
                      (currentSound) => currentSound !== sound
                    )
                  } else {
                    this.plugin.settings.tickSounds.push(sound)
                  }
                  this.plugin.saveSettings()
                  this.update()
                },
                (sound, isSelected) => `tick-sound-btn${isSelected ? ' mod-cta' : ''}`
              )
            },
          },
          {
            name: 'Selected sounds',
            desc: `${tickSoundCount} sound(s): ${this.plugin.settings.tickSounds.join(', ')}`,
            visible: () =>
              this.plugin.settings.tickSoundEnabled &&
              this.plugin.settings.useRandomTickSound &&
              tickSoundCount > 0,
          },
          {
            name: '⚠️ No sounds selected',
            desc: 'Click on sounds above to add them to the random selection.',
            visible: () =>
              this.plugin.settings.tickSoundEnabled &&
              this.plugin.settings.useRandomTickSound &&
              tickSoundCount === 0,
          },
          {
            name: 'Tick sound',
            desc: 'Select a sound to play when a checkbox is ticked.',
            visible: () =>
              this.plugin.settings.tickSoundEnabled && !this.plugin.settings.useRandomTickSound,
            control: {
              type: 'dropdown',
              key: 'tickSound',
              options: soundOptions,
            },
          },
          {
            name: 'Tick sound volume',
            desc: 'Adjust the volume of the sound when a checkbox is ticked.',
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
            name: 'Test tick sound',
            desc: 'Click to test out your checkbox tick sound configuration.',
            visible: () => this.plugin.settings.tickSoundEnabled,
            render: (setting) => {
              setting.setName('Test tick sound')
              setting.setDesc('Click to test out your checkbox tick sound configuration.')
              setting.addButton((button) => {
                button.setButtonText('Play sound')
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
            name: 'Untick sound enabled',
            desc: 'Toggle if a sound should be played when a checkbox is unticked.',
            control: { type: 'toggle', key: 'untickSoundEnabled' },
          },
          {
            name: 'Use random untick sound',
            desc: 'Play a random sound from a list when checkbox is unticked.',
            visible: () => this.plugin.settings.untickSoundEnabled,
            control: { type: 'toggle', key: 'useRandomUntickSound' },
          },
          {
            name: 'Random untick sounds',
            desc:
              'Select sounds to include in the random selection. Click a sound to add/remove it from the list.',
            visible: () =>
              this.plugin.settings.untickSoundEnabled && this.plugin.settings.useRandomUntickSound,
            render: (setting) => {
              setting.setName('Random untick sounds')
              setting.setDesc(
                'Select sounds to include in the random selection. Click a sound to add/remove it from the list.'
              )
              this.renderSoundList(
                setting,
                sounds,
                this.plugin.settings.untickSounds,
                'untick-sound-list',
                (sound, isSelected) => {
                  if (isSelected) {
                    this.plugin.settings.untickSounds = this.plugin.settings.untickSounds.filter(
                      (currentSound) => currentSound !== sound
                    )
                  } else {
                    this.plugin.settings.untickSounds.push(sound)
                  }
                  this.plugin.saveSettings()
                  this.update()
                },
                (_sound, isSelected) => (isSelected ? 'mod-cta' : '')
              )
            },
          },
          {
            name: 'Selected sounds',
            desc: `${untickSoundCount} sound(s): ${this.plugin.settings.untickSounds.join(', ')}`,
            visible: () =>
              this.plugin.settings.untickSoundEnabled &&
              this.plugin.settings.useRandomUntickSound &&
              untickSoundCount > 0,
          },
          {
            name: '⚠️ No sounds selected',
            desc: 'Click on sounds above to add them to the random selection.',
            visible: () =>
              this.plugin.settings.untickSoundEnabled &&
              this.plugin.settings.useRandomUntickSound &&
              untickSoundCount === 0,
          },
          {
            name: 'Untick sound',
            desc: 'Select a sound to be played when a checkbox is unticked.',
            visible: () =>
              this.plugin.settings.untickSoundEnabled && !this.plugin.settings.useRandomUntickSound,
            control: {
              type: 'dropdown',
              key: 'untickSound',
              options: soundOptions,
            },
          },
          {
            name: 'Untick sound volume',
            desc: 'Adjust the volume of the sound when a checkbox is unticked.',
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
            name: 'Test untick sound',
            desc: 'Click to test out your checkbox untick sound configuration.',
            visible: () => this.plugin.settings.untickSoundEnabled,
            render: (setting) => {
              setting.setName('Test untick sound')
              setting.setDesc('Click to test out your checkbox untick sound configuration.')
              setting.addButton((button) => {
                button.setButtonText('Play sound')
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
        heading: 'Sounds',
        items: [
          {
            name: 'Reload',
            desc: 'Click to reload the available sounds.',
            render: (setting) => {
              setting.setName('Reload')
              setting.setDesc('Click to reload the available sounds.')
              setting.addButton((button) => {
                button.setButtonText('Reload sounds')
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
    onToggle: (sound: string, isSelected: boolean) => void,
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
        onToggle(sound, isSelected)
      }
    })
  }
}

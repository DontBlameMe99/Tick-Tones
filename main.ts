import { Plugin } from 'obsidian'
import { TickTonesSettingsTab } from 'src/settings'
import { SoundManager } from 'src/soundManager'
import { DEFAULT_SETTINGS, type TickTonesSettings } from 'src/types'

export default class TickTones extends Plugin {
  settings: TickTonesSettings = DEFAULT_SETTINGS
  private soundManager!: SoundManager
  private settingsTab!: TickTonesSettingsTab

  async onload() {
    await this.loadSettings()

    this.soundManager = new SoundManager(this.app, this, this.manifest.dir!)
    await this.soundManager.init()

    this.settingsTab = new TickTonesSettingsTab(this.app, this, this.soundManager)
    this.addSettingTab(this.settingsTab)

    const observer = new MutationObserver((mutations) => {
      const processed = new Set<Element>()
      for (const mutation of mutations) {
        if (mutation.type !== 'attributes') continue
        const el = mutation.target as HTMLElement

        const checkbox: HTMLInputElement | null = el.classList.contains('task-list-item-checkbox')
          ? (el as HTMLInputElement)
          : el.querySelector('.task-list-item-checkbox')

        if (!checkbox || processed.has(checkbox)) continue
        processed.add(checkbox)

        if (checkbox.checked && mutation.oldValue !== 'x') {
          this.soundManager.playTickSound()
        } else if (!checkbox.checked && mutation.oldValue === 'x') {
          this.soundManager.playUntickSound()
        }
      }
    })

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-task'],
      attributeOldValue: true,
    })

    this.register(() => observer.disconnect())
  }

  onunload() {
    this.soundManager?.unload()
  }

  async loadSettings() {
    try {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    } catch {
      this.settings = { ...DEFAULT_SETTINGS }
    }
  }

  saveSettings() {
    this.saveData(this.settings).catch((err) => {
      console.error('Failed to save settings.', err)
    })
  }
}

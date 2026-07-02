import { beforeEach, describe, expect, it, jest } from 'bun:test'
import type { App } from 'obsidian'
import type TickTones from '../main'
import { TickTonesSettingsTab } from '../src/settings'
import type { SoundManager } from '../src/soundManager'
import { DEFAULT_SETTINGS } from '../src/types'

const getGroup = (definitions: any[], heading: string) =>
  definitions.find((item) => item.type === 'group' && item.heading === heading)

const getItem = (definitions: any[], name: string) => {
  for (const item of definitions) {
    if (item?.name === name) {
      return item
    }
    if (item?.items) {
      const nested = item.items.find((nestedItem: any) => nestedItem.name === name)
      if (nested) {
        return nested
      }
    }
  }
  return undefined
}

const isVisible = (visible: boolean | (() => boolean) | undefined) =>
  typeof visible === 'function' ? visible() : visible !== false

describe('TickTonesSettingsTab', () => {
  let app: App
  let plugin: TickTones
  let soundManager: SoundManager
  let tab: TickTonesSettingsTab

  beforeEach(() => {
    jest.clearAllMocks()

    app = {} as App
    plugin = {
      settings: { ...DEFAULT_SETTINGS },
      saveSettings: jest.fn(),
    } as any

    soundManager = {
      getSounds: jest.fn().mockReturnValue([]),
      reloadSounds: jest.fn().mockResolvedValue(undefined),
      playTickSound: jest.fn(),
      playUntickSound: jest.fn(),
    } as any

    tab = new TickTonesSettingsTab(app, plugin, soundManager)
  })

  it('returns the welcome groups when no sounds are available', () => {
    const definitions = tab.getSettingDefinitions()
    const welcomeGroup = getGroup(definitions, 'Get started')

    expect(welcomeGroup).toBeDefined()
    expect(isVisible(welcomeGroup.visible)).toBe(true)
    expect(
      welcomeGroup.items.some(
        (item: any) =>
          item.name === 'Drop your audio files into the plugin sounds folder, then reload below.'
      )
    ).toBe(true)

    const tickGroup = getGroup(definitions, 'Tick sound')
    expect(isVisible(tickGroup.visible)).toBe(false)
  })

  it('returns tick sound controls when sounds are available', () => {
    soundManager.getSounds = jest.fn().mockReturnValue(['lorem', 'ipsum'])
    const definitions = tab.getSettingDefinitions()
    const tickGroup = getGroup(definitions, 'Tick sound')

    expect(tickGroup).toBeDefined()
    expect(isVisible(tickGroup.visible)).toBe(true)

    const tickDropdown = tickGroup.items.find((item: any) => item.name === 'Single sound')
    expect(tickDropdown.control.type).toBe('dropdown')
    expect(tickDropdown.control.options).toEqual({ lorem: 'lorem', ipsum: 'ipsum' })
    expect(isVisible(tickDropdown.visible)).toBe(true)
  })

  it('setControlValue updates toggles and triggers update', () => {
    tab.setControlValue('tickSoundEnabled', false)

    expect(plugin.settings.tickSoundEnabled).toBe(false)
    expect(plugin.saveSettings).toHaveBeenCalled()
    expect(tab.update as jest.Mock).toHaveBeenCalled()
  })

  it('maps volume controls to stored values', () => {
    expect(tab.getControlValue('tickSoundVolume')).toBe(60)

    tab.setControlValue('tickSoundVolume', 75)

    expect(plugin.settings.tickSoundVolume).toBeCloseTo(0.75)
    expect(plugin.saveSettings).toHaveBeenCalled()
    expect(tab.refreshDomState as jest.Mock).toHaveBeenCalled()
  })

  it('renders random tick sounds list with button classes', () => {
    soundManager.getSounds = jest.fn().mockReturnValue(['lorem', 'ipsum', 'dolor'])
    plugin.settings.tickSoundEnabled = true
    plugin.settings.useRandomTickSound = true
    plugin.settings.tickSounds = ['lorem']

    const definitions = tab.getSettingDefinitions()
    const randomListDefinition = getItem(definitions, 'Sounds')

    const mockButtons: any[] = []
    const mockCreateEl = jest.fn((type: string, options: any) => {
      const button = {
        type,
        onclick: null as null | (() => void),
        ...options,
      }
      mockButtons.push(button)
      return button
    })
    const mockDiv = { createEl: mockCreateEl }
    const mockControlEl = {
      empty: jest.fn(),
      createDiv: jest.fn().mockReturnValue(mockDiv),
    }
    const mockSetting = {
      setName: jest.fn().mockReturnThis(),
      setDesc: jest.fn().mockReturnThis(),
      controlEl: mockControlEl,
    }

    randomListDefinition.render(mockSetting, {} as any)

    expect(mockControlEl.createDiv).toHaveBeenCalledWith('tick-sound-list')
    expect(mockButtons).toHaveLength(3)
    expect(mockButtons[0].cls).toBe('tick-sound-btn mod-cta')
    expect(mockButtons[1].cls).toBe('tick-sound-btn')
  })

  it('adds a sound when an unselected random tick button is clicked', () => {
    soundManager.getSounds = jest.fn().mockReturnValue(['lorem', 'ipsum'])
    plugin.settings.tickSoundEnabled = true
    plugin.settings.useRandomTickSound = true
    plugin.settings.tickSounds = []

    const definitions = tab.getSettingDefinitions()
    const randomListDefinition = getItem(definitions, 'Sounds')

    const mockButtons: any[] = []
    const mockCreateEl = jest.fn((type: string, options: any) => {
      const button = {
        type,
        onclick: null as null | (() => void),
        addClass: jest.fn(),
        removeClass: jest.fn(),
        ...options,
      }
      mockButtons.push(button)
      return button
    })
    const mockDiv = { createEl: mockCreateEl }
    const mockControlEl = {
      empty: jest.fn(),
      createDiv: jest.fn().mockReturnValue(mockDiv),
    }
    const mockSetting = {
      setName: jest.fn().mockReturnThis(),
      setDesc: jest.fn().mockReturnThis(),
      controlEl: mockControlEl,
    }

    randomListDefinition.render(mockSetting, {} as any)

    mockButtons[0].onclick?.()

    expect(plugin.settings.tickSounds).toContain('lorem')
    expect(plugin.saveSettings).toHaveBeenCalled()
    expect(mockButtons[0].addClass).toHaveBeenCalledWith('mod-cta')
  })

  it('reloads sounds and updates when reload button is clicked', async () => {
    const definitions = tab.getSettingDefinitions()
    const soundsGroup = getGroup(definitions, 'Sound files')
    const reloadDefinition = soundsGroup.items[0]

    const mockButton: any = {
      setIcon: jest.fn().mockReturnThis(),
      setTooltip: jest.fn().mockReturnThis(),
      onClick: jest.fn((cb: () => Promise<void>) => {
        mockButton.click = cb
      }),
    }
    const mockSetting = {
      setName: jest.fn().mockReturnThis(),
      setDesc: jest.fn().mockReturnThis(),
      addButton: jest.fn((cb: (button: any) => void) => {
        cb(mockButton)
        return mockSetting
      }),
    }

    reloadDefinition.render(mockSetting, {} as any)

    await mockButton.click()

    expect(mockButton.setIcon).toHaveBeenCalledWith('folder-open')
    expect(mockButton.setTooltip).toHaveBeenCalledWith('Open sounds folder')
    expect(mockButton.setIcon).toHaveBeenCalledWith('refresh-cw')
    expect(mockButton.setTooltip).toHaveBeenCalledWith('Reload sounds')
    expect(soundManager.reloadSounds).toHaveBeenCalled()
    expect(tab.update as jest.Mock).toHaveBeenCalled()
  })
})

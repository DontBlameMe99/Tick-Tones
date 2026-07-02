import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test'
import type { App } from 'obsidian'
import { Notice } from 'obsidian'
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
      playTickSound: jest.fn().mockResolvedValue(undefined),
      playUntickSound: jest.fn().mockResolvedValue(undefined),
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

  describe('downloadSampleSounds', () => {
    let mockAdapter: { mkdir: jest.Mock; writeBinary: jest.Mock }

    beforeEach(() => {
      mockAdapter = {
        mkdir: jest.fn().mockResolvedValue(undefined),
        writeBinary: jest.fn().mockResolvedValue(undefined),
      }
      ;(app as any).vault = { adapter: mockAdapter }
      ;(plugin as any).manifest = { dir: '.obsidian/plugins/tick-tones' }
      ;(plugin as any).app = app
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      }) as any
    })

    afterEach(() => {
      ;(app as any).vault = undefined
      ;(plugin as any).manifest = undefined
      ;(plugin as any).app = undefined
      ;(globalThis as any).fetch = undefined
    })

    it('downloads sample sounds successfully', async () => {
      await (tab as any).downloadSampleSounds()

      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/DontBlameMe99/Tick-Tones/master/assets/Microsoft_ToDo.wav'
      )
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/DontBlameMe99/Tick-Tones/master/assets/Task_Completed.wav'
      )
      expect(mockAdapter.mkdir).toHaveBeenCalledWith('.obsidian/plugins/tick-tones/assets')
      expect(mockAdapter.writeBinary).toHaveBeenCalledTimes(2)
      expect(Notice).toHaveBeenCalledWith('Downloaded 2 sample sounds.')
    })

    it('handles network failure gracefully', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any

      await (tab as any).downloadSampleSounds()

      expect(Notice).toHaveBeenCalledWith('Failed to download Microsoft_ToDo.wav')
      expect(mockAdapter.writeBinary).not.toHaveBeenCalled()
    })

    it('handles HTTP error status gracefully', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        arrayBuffer: jest.fn(),
      }) as any

      await (tab as any).downloadSampleSounds()

      expect(Notice).toHaveBeenCalledWith('Failed to download Microsoft_ToDo.wav')
      expect(mockAdapter.writeBinary).not.toHaveBeenCalled()
    })

    it('handles partial download failure gracefully', async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          arrayBuffer: jest.fn(),
        }) as any

      await (tab as any).downloadSampleSounds()

      expect(mockAdapter.writeBinary).toHaveBeenCalledTimes(1)
      expect(Notice).toHaveBeenCalledWith('Failed to download Task_Completed.wav')
    })

    it('handles mkdir failure when folder already exists', async () => {
      mockAdapter.mkdir = jest.fn().mockRejectedValue(new Error('folder exists'))

      await (tab as any).downloadSampleSounds()

      expect(mockAdapter.writeBinary).toHaveBeenCalledTimes(2)
      expect(Notice).toHaveBeenCalledWith('Downloaded 2 sample sounds.')
    })
  })

  describe('welcome download button', () => {
    it('is configured with correct name, description, and icon', () => {
      const definitions = tab.getSettingDefinitions()
      const welcomeGroup = getGroup(definitions, 'Get started')
      const downloadItem = welcomeGroup.items.find((i: any) => i.name === '')
      expect(downloadItem).toBeDefined()

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

      downloadItem.render!(mockSetting, {} as any)

      expect(mockSetting.setName).toHaveBeenCalledWith('Download sample sounds')
      expect(mockSetting.setDesc).toHaveBeenCalledWith('Get started with pre-made sounds.')
      expect(mockButton.setIcon).toHaveBeenCalledWith('download')
      expect(mockButton.setTooltip).toHaveBeenCalledWith('Download sample sounds')
    })

    it('triggers download, reload, and update when clicked', async () => {
      const mockAdapter = {
        mkdir: jest.fn().mockResolvedValue(undefined),
        writeBinary: jest.fn().mockResolvedValue(undefined),
      }
      ;(app as any).vault = { adapter: mockAdapter }
      ;(plugin as any).manifest = { dir: '.obsidian/plugins/tick-tones' }
      ;(plugin as any).app = app
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      }) as any

      const definitions = tab.getSettingDefinitions()
      const welcomeGroup = getGroup(definitions, 'Get started')
      const downloadItem = welcomeGroup.items.find((i: any) => i.name === '')

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

      downloadItem.render!(mockSetting, {} as any)
      await mockButton.click()

      expect(globalThis.fetch).toHaveBeenCalled()
      expect(soundManager.reloadSounds).toHaveBeenCalled()
      expect(tab.update as jest.Mock).toHaveBeenCalled()

      ;(app as any).vault = undefined
      ;(plugin as any).manifest = undefined
      ;(plugin as any).app = undefined
      ;(globalThis as any).fetch = undefined
    })
  })

  describe('preview buttons', () => {
    beforeEach(() => {
      soundManager.getSounds = jest.fn().mockReturnValue(['lorem', 'ipsum'])
    })

    it('tick preview button plays tick sound when clicked', () => {
      plugin.settings.tickSoundEnabled = true
      plugin.settings.tickSound = 'lorem'

      const definitions = tab.getSettingDefinitions()
      const tickGroup = getGroup(definitions, 'Tick sound')
      const previewItem = tickGroup.items.find((i: any) => i.name === '')
      expect(previewItem).toBeDefined()
      expect(isVisible(previewItem.visible)).toBe(true)

      const mockButton: any = {
        setIcon: jest.fn().mockReturnThis(),
        setTooltip: jest.fn().mockReturnThis(),
        onClick: jest.fn((cb: () => void) => {
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

      previewItem.render!(mockSetting, {} as any)

      expect(mockSetting.setName).toHaveBeenCalledWith('Preview')
      expect(mockSetting.setDesc).toHaveBeenCalledWith('Play the current tick sound to test it.')
      expect(mockButton.setIcon).toHaveBeenCalledWith('play')
      expect(mockButton.setTooltip).toHaveBeenCalledWith('Play tick sound')

      mockButton.click()

      expect(soundManager.playTickSound).toHaveBeenCalled()
    })

    it('tick preview button warns when no sound is selected', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      plugin.settings.tickSoundEnabled = true
      plugin.settings.tickSound = ''

      const definitions = tab.getSettingDefinitions()
      const tickGroup = getGroup(definitions, 'Tick sound')
      const previewItem = tickGroup.items.find((i: any) => i.name === '')

      const mockButton: any = {
        setIcon: jest.fn().mockReturnThis(),
        setTooltip: jest.fn().mockReturnThis(),
        onClick: jest.fn((cb: () => void) => {
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

      previewItem.render!(mockSetting, {} as any)
      mockButton.click()

      expect(warnSpy).toHaveBeenCalledWith('No sound selected, cannot play sound.')
      expect(soundManager.playTickSound).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('untick preview button plays untick sound when clicked', () => {
      plugin.settings.untickSoundEnabled = true
      plugin.settings.untickSound = 'ipsum'

      const definitions = tab.getSettingDefinitions()
      const untickGroup = getGroup(definitions, 'Untick sound')
      const previewItem = untickGroup.items.find((i: any) => i.name === '')
      expect(previewItem).toBeDefined()
      expect(isVisible(previewItem.visible)).toBe(true)

      const mockButton: any = {
        setIcon: jest.fn().mockReturnThis(),
        setTooltip: jest.fn().mockReturnThis(),
        onClick: jest.fn((cb: () => void) => {
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

      previewItem.render!(mockSetting, {} as any)

      expect(mockSetting.setName).toHaveBeenCalledWith('Preview')
      expect(mockSetting.setDesc).toHaveBeenCalledWith('Play the current untick sound to test it.')
      expect(mockButton.setIcon).toHaveBeenCalledWith('play')
      expect(mockButton.setTooltip).toHaveBeenCalledWith('Play untick sound')

      mockButton.click()

      expect(soundManager.playUntickSound).toHaveBeenCalled()
    })

    it('preview buttons are hidden when their sound is disabled', () => {
      plugin.settings.tickSoundEnabled = false
      plugin.settings.untickSoundEnabled = false

      const definitions = tab.getSettingDefinitions()
      const tickGroup = getGroup(definitions, 'Tick sound')
      const untickGroup = getGroup(definitions, 'Untick sound')

      const tickPreview = tickGroup.items.find((i: any) => i.name === '')
      const untickPreview = untickGroup.items.find((i: any) => i.name === '')

      expect(isVisible(tickPreview.visible)).toBe(false)
      expect(isVisible(untickPreview.visible)).toBe(false)
    })
  })

  describe('untick group', () => {
    it('is visible when sounds are available', () => {
      soundManager.getSounds = jest.fn().mockReturnValue(['lorem', 'ipsum'])
      const definitions = tab.getSettingDefinitions()
      const untickGroup = getGroup(definitions, 'Untick sound')
      expect(untickGroup).toBeDefined()
      expect(isVisible(untickGroup.visible)).toBe(true)
    })

    it('is hidden when no sounds are available', () => {
      const definitions = tab.getSettingDefinitions()
      const untickGroup = getGroup(definitions, 'Untick sound')
      expect(untickGroup).toBeDefined()
      expect(isVisible(untickGroup.visible)).toBe(false)
    })
  })
})

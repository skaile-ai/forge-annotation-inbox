// @vitest-environment happy-dom
import { nextTick } from 'vue'
import { resetSettingsStorage, setSettingsStorage, useSettings } from 'agentation-vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyToolbarPlacement } from '../modules/annotation-inbox/runtime/placement'
import type { SettingsStorage } from '../modules/annotation-inbox/runtime/placement'

/**
 * What a host's `toolbarPlacement` promises: the toggle starts where the host
 * said, until the user picks a corner — and the user's pick, once stored, wins.
 *
 * Against the real library's settings store, because the promise rests on how
 * agentation-vue loads and writes its settings, not on this package alone.
 */

const KEY = 'agentation-vue-settings'

/** A settings store with nothing in it, or with `stored` as the user's saved settings. */
function memory(stored?: Record<string, unknown>) {
  const items = new Map<string, string>()
  if (stored) items.set(KEY, JSON.stringify(stored))
  const storage: SettingsStorage = {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
  }
  const saved = () => {
    const raw = items.get(KEY)
    return raw === undefined ? undefined : JSON.parse(raw) as Record<string, unknown>
  }
  return { storage, saved }
}

const { settings } = useSettings()

describe('toolbarPlacement', () => {
  beforeEach(() => {
    localStorage.clear()
    resetSettingsStorage()
  })
  afterEach(() => vi.restoreAllMocks())

  it('puts the toggle at the host default when nothing is stored', async () => {
    const { storage, saved } = memory()
    applyToolbarPlacement(setSettingsStorage, 'bottom-left', storage)

    expect(settings.toolbarPlacement).toBe('bottom-left')
    await nextTick()
    expect(saved()).not.toHaveProperty('toolbarPlacement')
  })

  it('keeps a placement the user stored over the host default', () => {
    const { storage } = memory({ toolbarPlacement: 'top-right', markerColor: '#ff0000' })
    applyToolbarPlacement(setSettingsStorage, 'bottom-left', storage)

    expect(settings.toolbarPlacement).toBe('top-right')
    expect(settings.markerColor).toBe('#ff0000')
  })

  it('keeps the placement the user picks across a reload', async () => {
    const { storage, saved } = memory()
    applyToolbarPlacement(setSettingsStorage, 'bottom-left', storage)
    settings.toolbarPlacement = 'top-center'
    await nextTick()
    expect(saved()?.toolbarPlacement).toBe('top-center')

    resetSettingsStorage()
    applyToolbarPlacement(setSettingsStorage, 'bottom-left', storage)
    expect(settings.toolbarPlacement).toBe('top-center')
  })

  it('moves a user who never picked a placement when the host moves its default', async () => {
    const { storage } = memory()
    applyToolbarPlacement(setSettingsStorage, 'bottom-left', storage)
    settings.markerColor = '#123456'
    await nextTick()

    resetSettingsStorage()
    applyToolbarPlacement(setSettingsStorage, 'top-left', storage)
    expect(settings.toolbarPlacement).toBe('top-left')
    expect(settings.markerColor).toBe('#123456')
  })

  it('leaves the toggle at bottom-right when the host sets nothing', () => {
    applyToolbarPlacement(setSettingsStorage, undefined)

    expect(settings.toolbarPlacement).toBe('bottom-right')
  })

  it('ignores a value that is not an anchor, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const install = vi.fn()
    applyToolbarPlacement(install, 'middle')

    expect(install).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]![0]).toContain('"middle"')
  })
})

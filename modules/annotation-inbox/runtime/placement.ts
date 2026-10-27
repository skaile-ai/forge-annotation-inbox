/// <reference types="vite/client" />
import { TOOLBAR_PLACEMENTS } from '../contract'
import type { ToolbarPlacement } from '../contract'

/**
 * The host's say in where the toolbar's collapsed toggle sits until the user
 * picks a corner of their own in the toolbar's settings panel.
 *
 * **Through the library's exported API only.** agentation-vue has no
 * placement prop; placement is one of its settings, a reactive object loaded
 * from a settings store merged over the library's defaults. The store is
 * replaceable (`setSettingsStorage`, exported), so the host default goes in as
 * a store that answers with it wherever the user's stored settings say
 * nothing. Relies on agentation-vue 0.3.0's behaviour: `loadSettings()` is
 * `{ ...defaults, ...JSON.parse(getItem(key)) }`, and every settings change —
 * including the reload `setSettingsStorage` does — writes the whole object
 * back with `setItem`.
 *
 * **The host default is never stored as the user's choice.** Because the
 * library writes the whole object back, the host default would otherwise land
 * in `localStorage` on the first page load and from then on be
 * indistinguishable from a choice; a host that later moves its default would
 * move nobody. The store therefore drops `toolbarPlacement` from a write when
 * it equals the host default. A user who picks that very anchor follows the
 * host's default from then on, which is the same corner today.
 *
 * Like `./inbox`, this file names no toolbar library: the mount hands the
 * library's `setSettingsStorage` in.
 */

/** What the library's `setSettingsStorage` takes. */
export interface SettingsStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

/** The library's own fallback store, read lazily so a sandbox that forbids `localStorage` throws inside the library's `try`. */
const localSettings: SettingsStorage = {
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
}

/**
 * Install `placement` as the toolbar's default placement. `undefined` leaves
 * the library alone (its default, `'bottom-right'`); anything that is not one
 * of {@link TOOLBAR_PLACEMENTS} is ignored too, with a warning in a dev build.
 * Call before the toolbar mounts.
 */
export function applyToolbarPlacement(
  setSettingsStorage: (storage: SettingsStorage) => void,
  placement: unknown,
  storage: SettingsStorage = localSettings,
): void {
  if (placement === undefined) return
  if (!isToolbarPlacement(placement)) {
    if (import.meta.env.DEV) {
      console.warn(
        `annotation inbox: ignoring toolbarPlacement ${JSON.stringify(placement)}; `
        + `expected one of ${TOOLBAR_PLACEMENTS.join(', ')}`,
      )
    }
    return
  }
  setSettingsStorage(withDefaultPlacement(placement, storage))
}

function isToolbarPlacement(value: unknown): value is ToolbarPlacement {
  return (TOOLBAR_PLACEMENTS as readonly unknown[]).includes(value)
}

/** Stored settings as an object; `{}` when nothing is stored, `undefined` when what is stored is not an object. */
function parseSettings(raw: string | null): Record<string, unknown> | undefined {
  if (raw === null) return {}
  try {
    const value: unknown = JSON.parse(raw)
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined
  } catch {
    return undefined
  }
}

function withDefaultPlacement(placement: ToolbarPlacement, storage: SettingsStorage): SettingsStorage {
  return {
    getItem(key) {
      const raw = storage.getItem(key)
      const stored = parseSettings(raw)
      // Unreadable settings go back untouched: the library already falls back
      // to its defaults for those, and this store does not repair them.
      if (stored === undefined) return raw
      return JSON.stringify({ toolbarPlacement: placement, ...stored })
    },
    setItem(key, value) {
      const settings = parseSettings(value)
      if (settings?.toolbarPlacement === placement) {
        const { toolbarPlacement: _hostDefault, ...rest } = settings
        value = JSON.stringify(rest)
      }
      storage.setItem(key, value)
    },
  }
}

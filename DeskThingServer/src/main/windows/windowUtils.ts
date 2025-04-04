/**
 * Shared window utilities
 */
import { BrowserWindow } from 'electron'

/**
 * Safely focuses a window, restoring it if minimized
 */
export function focusWindow(window: BrowserWindow | null): void {
  if (window && !window.isDestroyed()) {
    if (window.isMinimized()) {
      window.restore()
    }
    window.focus()
  }
}

/**
 * Safely closes a window
 */
export function closeWindow(window: BrowserWindow | null): void {
  if (window && !window.isDestroyed()) {
    window.close()
  }
}

/**
 * Checks if a window exists and is not destroyed
 */
export function isWindowValid(window: BrowserWindow | null): boolean {
  return !!window && !window.isDestroyed()
}

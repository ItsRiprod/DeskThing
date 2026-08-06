import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  DockLike,
  initDockVisibility,
  isDockVisible,
  onDockVisibilityChange,
  setDockVisible,
  toggleDockVisible,
  __resetDockVisibility
} from '../../../src/main/system/dockVisibility'

/**
 * Stands in for `app.dock`. The detail that matters is that `show()` is
 * asynchronous and `hide()`/`isVisible()` are not — the asymmetry the real API
 * has, and the thing the old toggle tripped over.
 */
const fakeDock = (showDelayMs = 20) => {
  let visible = true
  const calls: string[] = []
  const dock: DockLike = {
    async show() {
      calls.push('show')
      await new Promise((r) => setTimeout(r, showDelayMs))
      visible = true
    },
    hide() {
      calls.push('hide')
      visible = false
    },
    isVisible: () => visible
  }
  return { dock, calls, current: () => visible }
}

const settle = (ms = 250) => new Promise((r) => setTimeout(r, ms))

describe('dock visibility', () => {
  beforeEach(() => {
    __resetDockVisibility()
  })

  it('hides the dock icon when asked', async () => {
    const f = fakeDock()
    initDockVisibility(f.dock, true)

    await setDockVisible(false)

    expect(f.current()).toBe(false)
    expect(isDockVisible()).toBe(false)
  })

  it('shows it again', async () => {
    const f = fakeDock()
    initDockVisibility(f.dock, true)

    await setDockVisible(false)
    await setDockVisible(true)

    expect(f.current()).toBe(true)
    expect(isDockVisible()).toBe(true)
  })

  it('reports the requested state immediately, before the dock catches up', () => {
    // The menu label is built from this. It has to describe what was just
    // clicked, not what AppKit has finished doing.
    const f = fakeDock(50)
    initDockVisibility(f.dock, true)

    setDockVisible(false) // deliberately not awaited

    expect(isDockVisible()).toBe(false)
  })

  it('ends in the right state after hide -> show -> hide in quick succession', async () => {
    // The regression. The old code read app.dock.isVisible() on each click;
    // mid-transition that returns the state being left, so the second click
    // picked the wrong branch and the icon ended up inverted.
    const f = fakeDock(30)
    initDockVisibility(f.dock, true)

    setDockVisible(false)
    setDockVisible(true)
    setDockVisible(false)
    await settle()

    expect(f.current()).toBe(false)
    expect(isDockVisible()).toBe(false)
  })

  it('ends visible after show -> hide -> show in quick succession', async () => {
    const f = fakeDock(30)
    initDockVisibility(f.dock, true)

    await setDockVisible(false)

    setDockVisible(true)
    setDockVisible(false)
    setDockVisible(true)
    await settle()

    expect(f.current()).toBe(true)
    expect(isDockVisible()).toBe(true)
  })

  it('coalesces a burst instead of running one operation per click', async () => {
    const f = fakeDock(30)
    initDockVisibility(f.dock, true)

    for (let i = 0; i < 10; i++) setDockVisible(i % 2 === 1)
    await settle()

    // Ten clicks alternating from visible end on hidden (i=0 hides, i=9 shows…
    // last write wins), and the dock should not have been driven ten times.
    expect(f.current()).toBe(isDockVisible())
    expect(f.calls.length).toBeLessThan(10)
  })

  it('survives many rapid toggles and still agrees with the label', async () => {
    const f = fakeDock(5)
    initDockVisibility(f.dock, true)

    for (let i = 0; i < 25; i++) toggleDockVisible()
    await settle(400)

    expect(f.current()).toBe(isDockVisible())
  })

  it('notifies listeners so the menu label can be rebuilt', async () => {
    const f = fakeDock()
    initDockVisibility(f.dock, true)
    const seen: boolean[] = []
    onDockVisibilityChange((v) => seen.push(v))

    await setDockVisible(false)
    await setDockVisible(true)

    expect(seen).toEqual([false, true])
  })

  it('does not notify when the state did not actually change', async () => {
    const f = fakeDock()
    initDockVisibility(f.dock, true)
    const listener = vi.fn()
    onDockVisibilityChange(listener)

    await setDockVisible(true)

    expect(listener).not.toHaveBeenCalled()
  })

  it('starts from the dock’s real state rather than assuming visible', async () => {
    const f = fakeDock()
    f.dock.hide()
    initDockVisibility(f.dock, false)

    expect(isDockVisible()).toBe(false)

    await toggleDockVisible()
    expect(f.current()).toBe(true)
  })
})

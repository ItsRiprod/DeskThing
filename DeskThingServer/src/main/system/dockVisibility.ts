/**
 * Dock icon visibility (macOS).
 *
 * Hiding and showing the Dock icon looks like a boolean but is not one.
 * `app.dock.show()` is asynchronous — it resolves once AppKit has actually
 * changed the activation policy — while `hide()` and `isVisible()` are
 * synchronous. So `isVisible()` read during a transition reports the state
 * the app is leaving, not the one it is heading for.
 *
 * That is why the old one-liner
 *
 *     app.dock.isVisible() ? app.dock.hide() : app.dock.show()
 *
 * came apart under fast clicking: the second click reads a stale answer, picks
 * the wrong branch, and the icon ends up in the opposite state to the one the
 * menu just promised.
 *
 * The fix is to stop asking the system what it is doing and track what the user
 * asked for. Clicks update the desired state immediately; a single settle loop
 * drives the real dock towards it, coalescing anything that arrives in the
 * meantime. Ten clicks in a second produce one final state, not ten races.
 */

/** The part of Electron's `app.dock` this needs. Narrow, so tests can fake it. */
export interface DockLike {
  show(): Promise<void>
  hide(): void
  isVisible(): boolean
}

type Listener = (visible: boolean) => void

/** Safety valve: stop rather than spin if the dock API never reaches the target. */
const MAX_SETTLE_PASSES = 8

let dock: DockLike | null = null
let desired = true
let running = false
let settling: Promise<void> | null = null
const listeners = new Set<Listener>()

/**
 * @param initial What the dock is doing right now — normally `dock.isVisible()`.
 */
export function initDockVisibility(target: DockLike, initial = true): void {
  dock = target
  desired = initial
  running = false
  settling = null
}

/** What the user last asked for, which is what the menu label must agree with. */
export function isDockVisible(): boolean {
  return desired
}

export function onDockVisibilityChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Ask for a state. Returns once the dock has settled there.
 *
 * Callers do not need to await it — the menu label updates synchronously, so
 * the UI is correct the instant it is clicked regardless of how long AppKit
 * takes to catch up.
 */
export function setDockVisible(next: boolean): Promise<void> {
  const changed = desired !== next
  desired = next

  // Tell the UI straight away. The label must describe what the user just
  // asked for, not what the window server has got round to yet.
  if (changed) listeners.forEach((l) => l(desired))

  // Gate on `running`, not on `settling`. hide() is synchronous, so settle()
  // can finish entirely within this call — its cleanup then runs BEFORE the
  // assignment below, leaving `settling` holding an already-resolved promise
  // forever and every later click deciding a settle was still in flight.
  if (!running) settling = settle()
  return settling ?? Promise.resolve()
}

export function toggleDockVisible(): Promise<void> {
  return setDockVisible(!desired)
}

/**
 * Drive the real dock to the desired state, one operation at a time.
 *
 * Re-reads `desired` on every pass, so a click that lands mid-flight is picked
 * up by the loop already running instead of starting a second, competing one.
 */
async function settle(): Promise<void> {
  if (running) return
  running = true
  try {
    if (!dock) return
    // Loop on what the dock actually reports, not on a local belief, and
    // re-read `desired` each pass so a click that lands mid-flight is absorbed
    // by the loop already running rather than starting a competing one.
    let guard = 0
    while (dock.isVisible() !== desired) {
      if (++guard > MAX_SETTLE_PASSES) break // never spin on an API that will not move
      if (desired) {
        await dock.show()
      } else {
        dock.hide()
      }
    }
  } finally {
    running = false
  }
}

/** Test seam. */
export function __resetDockVisibility(): void {
  dock = null
  desired = true
  running = false
  settling = null
  listeners.clear()
}

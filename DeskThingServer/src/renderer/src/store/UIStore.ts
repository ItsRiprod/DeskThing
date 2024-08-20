/**
 * @file UIStore.ts
 * @description The UI store holds all the states of the UI across the program
 * @author Riprod
 * @version 0.8.0
 *
 */

/*

type StateCallback = (state: App[] | string | ViewMode) => void

export class UIStore {
  private static instance: UIStore

  private stateCallbacks: Map<string, StateCallback[]> = new Map()
  private currentView: string = 'landing'
  private views: App[] = []

  private appListener: (() => void)[] = []

  private appsListMode: ViewMode = 'hidden'
  private miniplayerMode: ViewMode = 'peek'

  private peekTimeout: NodeJS.Timeout | null = null

  private constructor() {
    this.appListener.push(AppStore.getInstance().onAppUpdates(this.updateAvailableViews.bind(this)))
  }

  static getInstance(): UIStore {
    if (!UIStore.instance) {
      UIStore.instance = new UIStore()
    }
    return UIStore.instance
  }

  // Notify all registered callbacks of the state update
  private async notifyStateUpdates(property: Property, value: any): Promise<void> {
    const callbacks = this.stateCallbacks.get(property)
    if (callbacks) {
      callbacks.forEach((callback) => callback(value))
    }
  }

  on(state: Property, callback: StateCallback) {
    if (!this.stateCallbacks.has(state)) {
      this.stateCallbacks.set(state, [])
    }
    this.stateCallbacks.get(state)!.push(callback)
    return () => {
      const updatedCallbacks = this.stateCallbacks.get(state)!.filter((cb) => cb !== callback)
      this.stateCallbacks.set(state, updatedCallbacks)
    }
  }

  /**
   *  Getter and Setters
   *

  private async updateAvailableViews(apps: App[]): Promise<void> {
    const filteredApps = apps.filter((app) => app.manifest?.isWebApp || app.manifest?.isLocalApp)

    const availableViews = filteredApps
      .sort((a, b) => a.prefIndex - b.prefIndex)
      .map((app, index) => {
        app.prefIndex = index // Reassign prefIndex sequentially
        return app
      })

    this.setAvailableViews(availableViews)
  }

  getAvailableViews(): App[] {
    return this.views
  }

  // Manage AppsList Mode
  getAppsListMode(): ViewMode {
    return this.appsListMode
  }

  async setAppsListMode(mode: ViewMode): Promise<void> {
    this.appsListMode = mode
    this.notifyStateUpdates('appsListMode', mode)

    if (mode === 'peek') {
      // Start a timer to hide the apps list after 5 seconds if in peek mode
      this.startPeekTimeout()
    } else if (this.peekTimeout) {
      // Clear the timer if the mode is no longer peek
      this.clearPeekTimeout()
    }
  }

  // Manage Miniplayer Mode
  getMiniplayerMode(): ViewMode {
    return this.miniplayerMode
  }

  async setMiniplayerMode(mode: ViewMode): Promise<void> {
    this.miniplayerMode = mode
    this.notifyStateUpdates('miniplayerMode', mode)
  }

  // Manage Views
  getCurrentView(): string {
    return this.currentView
  }

  async setCurrentView(view: string): Promise<void> {
    this.currentView = view
    this.notifyStateUpdates('currentView', view)
  }

  /**
   * Manage View Navigation
   *

  async shiftViewLeft(): Promise<void> {
    const currentIndex = this.views.findIndex((app) => app.name === this.currentView)
    if (currentIndex > 0) {
      this.setCurrentView(this.views[currentIndex - 1].name)
    }
  }

  async shiftViewRight(): Promise<void> {
    const currentIndex = this.views.findIndex((app) => app.name === this.currentView)
    if (currentIndex < this.views.length - 1) {
      this.setCurrentView(this.views[currentIndex + 1].name)
    }
  }

  async setPrefIndex(appName: string, newPrefIndex: number): Promise<void> {
    const appToMove = this.views.find((app) => app.name === appName)
    if (!appToMove) return

    const existingApp = this.views.find((app) => app.prefIndex === newPrefIndex)
    if (existingApp) {
      existingApp.prefIndex = appToMove.prefIndex
    }

    appToMove.prefIndex = newPrefIndex

    // Sort the views by the updated prefIndexes
    this.views.sort((a, b) => a.prefIndex - b.prefIndex)

    // Reassign indexes to ensure continuity
    this.views.forEach((app, index) => (app.prefIndex = index))

    this.notifyStateUpdates('availableViews', this.views)

    this.notifyServerOfPrefIndex(appName, newPrefIndex)
  }

  private notifyServerOfPrefIndex(appName: string, newPrefIndex: number) {
    if (socket.is_ready()) {
      const data = {
        app: 'server',
        type: 'set',
        request: 'update_pref_index',
        payload: { app: appName, index: newPrefIndex }
      }
      socket.post(data)
    }
  }

  async setAvailableViews(views: App[]): Promise<void> {
    this.views = views
    this.notifyStateUpdates('availableViews', this.views)
  }

  async goToLanding() {
    this.setCurrentView('landing')
  }

  async goToSettings() {
    this.setCurrentView('settings')
  }

  async goToDashboard() {
    this.setCurrentView('dashboard')
  }

  cleanup() {
    this.stateCallbacks.clear()
  }

  /**
   * Peek Timeout Management
   *

  private startPeekTimeout(): void {
    this.clearPeekTimeout() // Clear any existing timeout before starting a new one
    this.peekTimeout = setTimeout(() => {
      if (this.appsListMode === 'peek') {
        this.setAppsListMode('hidden')
      }
    }, 5000) // 5 seconds
  }

  private clearPeekTimeout(): void {
    if (this.peekTimeout) {
      clearTimeout(this.peekTimeout)
      this.peekTimeout = null
    }
  }
}

export default UIStore.getInstance()
*/
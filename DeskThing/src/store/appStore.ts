import WebSocketService, { App, socketData, Settings } from '../helpers/WebSocketService';
type AppUpdateCallbacks = (data: App[]) => void
type settingsUpdateCallbacks = (data: Settings) => void

  export class ViewStore {
    private static instance: ViewStore;
    private listeners: (() => void)[] = []
    private appUpdateCallbacks: AppUpdateCallbacks[] = [];
    private settingsUpdateCallbacks: settingsUpdateCallbacks[] = [];
    private currentView: string = 'landing'
    private apps: App[] = []
    private settings: Settings = undefined


    private constructor() {
      this.initialize()
    }
  
    static getInstance(): ViewStore {
      if (!ViewStore.instance) {
        ViewStore.instance = new ViewStore();
      }
      return ViewStore.instance;
    }

    private async initialize() {
      await new Promise(resolve => setTimeout(resolve, 100));
      const socket = await WebSocketService;
      this.listeners.push(socket.on('client', this.handleClientData.bind(this)));
    }

    // Notify all registered callbacks of the song data update
    private notifyAppUpdates() {
        this.appUpdateCallbacks.forEach(callback => callback(this.apps));
      }
    private notifySettingsUpdates() {
        this.settingsUpdateCallbacks.forEach(callback => callback(this.settings));
      }
    subscribeToAppUpdates(callback: AppUpdateCallbacks) {
      this.appUpdateCallbacks.push(callback);
      return () => {
        this.appUpdateCallbacks = this.appUpdateCallbacks.filter(cb => cb!== callback);
      };
    }
    subscribeToSettingsUpdates(callback: settingsUpdateCallbacks) {
      this.settingsUpdateCallbacks.push(callback);
      return () => {
        this.settingsUpdateCallbacks = this.settingsUpdateCallbacks.filter(cb => cb!== callback);
      };
    }
    
      getApps(): App[] {
        return this.apps;
      }

      getSettings(): Settings {
        return this.settings;
      }
    
      getCurrentView(): string {
        return this.currentView;
      }
      setCurrentView(view: string): void {
        this.currentView = view;
        this.notifyAppUpdates()
      }

      updateApps(newApp: App) {
        this.apps = [ ...this.apps, newApp ];
        this.notifyAppUpdates();
      }

    private handleClientData = (msg: socketData) => {
        if (msg.type ==='config') {
            const data = msg.data as App[]
            data.sort((a, b) => a.prefIndex - b.prefIndex);
            this.apps = data;
            this.notifyAppUpdates()
        } else if (msg.type ==='settings') {
            const data = msg.data as Settings
            this.settings = data;
            this.notifySettingsUpdates()
        }
      };

    cleanup() {
        this.listeners.forEach(removeListener => removeListener())
        this.appUpdateCallbacks = []
      }
  }

  export default ViewStore.getInstance();
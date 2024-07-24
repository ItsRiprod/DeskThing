import socket, { App, socketData } from '../helpers/WebSocketService';
type AppUpdateCallbacks = (data: App[]) => void

  class ViewStore {
    private static instance: ViewStore;
    private listeners: (() => void)[] = []
    private appUpdateCallbacks: AppUpdateCallbacks[] = [];
    private currentView: string = 'landing'
    private apps: App[] = []


    private constructor() {
      this.listeners.push(socket.on('client',this.handleClientData.bind(this)))
    }
  
    static getInstance(): ViewStore {
      if (!ViewStore.instance) {
        ViewStore.instance = new ViewStore();
      }
      return ViewStore.instance;
    }

    // Notify all registered callbacks of the song data update
    private notifyAppUpdates() {
        this.appUpdateCallbacks.forEach(callback => callback(this.apps));
      }
    subscribeToAppUpdates(callback: AppUpdateCallbacks) {
      this.appUpdateCallbacks.push(callback);
      return () => {
        this.appUpdateCallbacks = this.appUpdateCallbacks.filter(cb => cb!== callback);
      };
    }
    
      getApps(): App[] {
        return this.apps;
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
        }
      };

    cleanup() {
        this.listeners.forEach(removeListener => removeListener())
        this.appUpdateCallbacks = []
      }
  }

  export default ViewStore.getInstance();
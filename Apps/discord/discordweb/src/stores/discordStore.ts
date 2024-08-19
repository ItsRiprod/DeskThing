import { DeskThing } from "deskthing-client"
import { SocketData } from "deskthing-client/dist/types"

export interface userData {
  id: string
  username?: string | undefined
  nick?: string | undefined
  speaking?: boolean | undefined
  volume?: number | undefined
  avatar?: string | undefined
  mute?: boolean | undefined
  deaf?: boolean | undefined
  profile?: string | undefined
}

type EventUpdateCallbacks = (data: userData[]) => void

  class DiscordStore {
    private DeskThing: DeskThing
    private static instance: DiscordStore;
    private listeners: (() => void)[] = []
    
    private appUpdateCallbacks: EventUpdateCallbacks[] = [];
    private callData: userData[] = []
    //private notificationStack: userData[] = [] // Will be used later for notifications


    private constructor() {
      this.DeskThing = DeskThing.getInstance()
      this.listeners.push(this.DeskThing.on('discord', this.handleDiscordData.bind(this)))
    }
  
    static getInstance(): DiscordStore {
      if (!DiscordStore.instance) {
        DiscordStore.instance = new DiscordStore();
      }
      return DiscordStore.instance;
    }

    // Notify all registered callbacks of the song data update
    private notifyDataUpdates() {
        this.appUpdateCallbacks.forEach(callback => callback(this.callData));
    }
    subscribeToCallDataUpdate(callback: EventUpdateCallbacks) {
      this.appUpdateCallbacks.push(callback);
      return () => {
        this.appUpdateCallbacks = this.appUpdateCallbacks.filter(cb => cb!== callback);
      };
    }
    
    async handleDiscordData(data: SocketData): Promise<void> {
        if (data.type == 'data') {
          switch (data.request) {
            case 'join':
              this.callData = []
              this.requestCallData()
              break;
            case 'leave':
              this.callData = []
              break;
          case 'disconnect':
            this.requestCallData()
            break;
          case 'update':
            if (data.payload)
              this.updateCallData(data.payload[0])
            break;
          case 'voice':
            if (data.payload)
              this.updateCallData(data.payload[0])
            break;
          case 'call':
            this.callData = data.payload as userData[];
            break;
          default:
            break;
        }
      }

      this.notifyDataUpdates();
    }

    async updateCallData(newData: userData) {
      this.callData = this.callData.map(user => 
        user.id === newData.id ? { ...user, ...newData } : user
      );
  
      // If the user ID is not present in the array, add the new user
      if (!this.callData.some(user => user.id === newData.id) && newData.id) {
        this.callData = [newData, ...this.callData];
      }
  
      this.notifyDataUpdates();
    }

    getCallData(): userData[] {
      return this.callData;
    }

    requestCallData(): void {
      this.DeskThing.sendMessageToParent({type: 'get', request: 'call'})
    }

    cleanup() {
        //this.listeners.forEach(removeListener => removeListener())
        this.appUpdateCallbacks = []
      }
  }

  export default DiscordStore.getInstance();
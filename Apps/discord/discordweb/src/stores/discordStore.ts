export type userData = {
    id: string
    username: string
    channel_id?: string
    nick?: string
    avatar?: string
    speaking?: boolean
    muted?: boolean
    state?: string 
    profile?: string 
    [key: string]: string | boolean | undefined | number
}

type discordData = {
    action: ACTION_TYPES
    user: userData
    [key: string]: string | boolean | userData | undefined
}

export enum ACTION_TYPES {
    SPEAKING = 'speaking', // Whether or not the user is speaking
    CONNECT = 'connect', // When a user connects
    DISCONNECT = 'disconnect', // When a user disconnects
    UPDATE = 'update', // When something is updated
    STATUS = 'status', // When you leave/join
}

type EventUpdateCallbacks = (data: userData[]) => void

  class ViewStore {
    private static instance: ViewStore;
    //private listeners: (() => void)[] = []
    private appUpdateCallbacks: EventUpdateCallbacks[] = [];
    private callData: userData[] = []
    //private notificationStack: userData[] = [] // Will be used later for notifications


    private constructor() {
      //this.listeners.push(socket.on('client',this.handleClientData.bind(this)))
    }
  
    static getInstance(): ViewStore {
      if (!ViewStore.instance) {
        ViewStore.instance = new ViewStore();
      }
      return ViewStore.instance;
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
    
    async handleDiscordData(msg: discordData): Promise<void> {
        console.log(msg)
        const user = msg.user;
        const index = this.callData.findIndex(u => u.id === user.id);
        
        switch (msg.action) {
          case ACTION_TYPES.SPEAKING:
            if (index !== -1) {
              this.callData[index].speaking = user.speaking;
            } else {
              this.callData.push(user);
            }
            break;
          case ACTION_TYPES.CONNECT:
            if (index !== -1) {
              this.callData[index] = user;
            } else {
              this.callData.push(user);
            }
            break;
          case ACTION_TYPES.DISCONNECT:
            if (index !== -1) {
              this.callData.splice(index, 1);
            }
            break;
          case ACTION_TYPES.UPDATE:
              if (index !== -1) {
                  this.callData[index] = { ...this.callData[index], ...user };
                } else {
                    console.log('Pushing Data')
                    this.callData.push(user);
              }
              break;
          case ACTION_TYPES.STATUS:
            // Disconnecting from call
            this.callData = []
            break;
        }
        
        this.notifyDataUpdates();
      }

    async updateCallData(newData: userData) {
        this.callData = [newData,...this.callData]
        this.notifyDataUpdates()
    }

      getCallData(): userData[] {
        return this.callData;
      }


    cleanup() {
        //this.listeners.forEach(removeListener => removeListener())
        this.appUpdateCallbacks = []
      }
  }

  export default ViewStore.getInstance();
import RPC, { Subscription, User } from 'discord-rpc';
import { DeskThing } from 'deskthing-server';


type ACTION_TYPES = 'speaking' | 'connect' | 'disconnect' | 'update' | 'status';


interface userData {
  id: string | undefined
  username?: string | undefined
  nick?: string | undefined
  speaking?: boolean | undefined
  volume?: number | undefined
  avatar?: string | undefined
  mute?: boolean | undefined
  deaf?: boolean | undefined
  profile?: string | undefined
};

interface voiceState {
  mute: boolean;
  deaf: boolean;
  self_mute: boolean;
  self_deaf: boolean;
  suppress: boolean;
}

type discordData = {
  action: ACTION_TYPES;
  user: User;
  voice_state: voiceState
  speaking: boolean
  nick: string
  volume: number
  mute: boolean
  [key: string]: string | boolean | undefined | User | voiceState | number;
};

type subscriptions = {
  voice: {[key: string]: Subscription[] };
};

type notificationData ={ 
  title: string
}


class DiscordHandler {
  private DeskThing: DeskThing
  private rpc: RPC.Client = new RPC.Client({ transport: 'ipc' });
  private subscriptions: subscriptions = { voice: {} };
  private startTimestamp: Date | null;
  connectedUsers: userData[];
  private redirect_url: string;
  private scopes: string[];
  private client_id: string | undefined = undefined;
  private client_secret: string | undefined = undefined;
  private token: string | undefined = undefined;

  constructor(DeskThing: DeskThing) {
    this.DeskThing = DeskThing
    this.subscriptions = { voice: {} };
    this.startTimestamp = null;
    this.connectedUsers = []; 
    this.redirect_url = 'http://localhost:8888/callback/discord';
    //this.scopes = [
    //  'rpc', 'messages.read', 'rpc.video.write', 'rpc.voice.read', 
    //  'rpc.activities.write', 'rpc.voice.write', 'rpc.screenshare.read', 
    //  'rpc.notifications.read', 'rpc.video.read', 'rpc.screenshare.write'
    //];
    this.scopes = [
      'rpc', 'rpc.voice.read', 
      'rpc.activities.write', 'rpc.voice.write', 
    ];
  }

  async registerRPC() {
    try {
      await this.sendLog('Registering RPC and logging in...');
      const data = await this.DeskThing.getData();
      if (data) {
        this.client_id = data.client_id as string;
        this.client_secret = data.client_secret as string;
        this.token = data.token as string
      }

      if (!this.client_id || !this.client_secret) {
        this.DeskThing.sendError('Missing client ID or secret');
        throw new Error('Missing client ID or secret');
      }

      RPC.register(this.client_id);
      await this.unsubscribe();
      this.subscriptions = { voice: {} };
      await this.initializeRpc();
      await this.login();

    } catch (exception) {
      await this.DeskThing.sendError(`RPC: Error registering RPC client: ${exception}`);
    }
  }

  async login() {
    try {
      
      if (!this.client_id || !this.client_secret) return

      await this.rpc.connect(this.client_id)

      console.log('Logging in...', this.client_id, this.client_secret, this.redirect_url, this.scopes);
      if (!this.token) {
        // @ts-ignore it is there just not in their types for some reason
        this.token = await this.rpc.authorize({ scopes: this.scopes, clientSecret: this.client_secret, redirectUri: this.redirect_url })
        await this.DeskThing.saveData({ token: this.token })
      }
      await this.rpc.login({
        scopes: this.scopes,
        clientId: this.client_id,
        clientSecret: this.client_secret,
        redirectUri: this.redirect_url,
        accessToken: this.token,
      });
      this.sendLog('RPC: @login Auth Successful');
    } catch (exception) {
      this.sendError(`Discord RPC Error: ${exception}`);
    }
  }

  async initializeRpc() {
    this.sendLog('RPC Initializing...');
    try {

      this.rpc.on('ready', async () => {
        this.sendLog('RPC ready! Setting activity and subscribing to events');
        const setActivity = (await this.DeskThing.getData())?.settings?.activity?.value
        if (setActivity) {
          const cancelTask = this.DeskThing.addBackgroundTaskLoop(async () => {
            this.rpc.clearActivity()
            await this.setActivity();
            await new Promise(resolve => setTimeout(resolve, 1000))
          });
        } else {
          this.sendLog('Not starting Activity due to settings')
        }
        this.setSubscribe();
      });
      this.rpc.on('VOICE_CHANNEL_SELECT', async (args) => {
        await this.handleVoiceChannelSelect(args.channel_id);
      });

      this.rpc.on('VOICE_STATE_CREATE', async (args) => {
        await this.handleVoiceStateCreate(args);
      });

      this.rpc.on('VOICE_STATE_DELETE', async (args) => {
        await this.handleVoiceStateDelete(args);
      });

      this.rpc.on('VOICE_STATE_UPDATE', async (args) => {
        await this.handleVoiceStateUpdate(args);
      });

      this.rpc.on('SPEAKING_START', async (args) => {
        await this.handleSpeakingStart(args);
      });

      this.rpc.on('SPEAKING_STOP', async (args) => {
        await this.handleSpeakingStop(args);
      });

      this.rpc.on('VOICE_CONNECTION_STATUS', async (args) => {
        await this.handleVoiceConnectionStatus(args);
      });

      this.rpc.on('error', (error) => {
        console.error('RPC Error:', error.message);
      });


      this.rpc.on('disconnected', async (closeEvent) => {
        console.warn(`Disconnected from Discord Error: ${closeEvent}`);
        await this.sendError('RPC Disconnected! Attempting to reconnect...');
        await this.login();
      });

      this.sendLog('RPC events setup!');

    } catch (ex) {
      this.sendError(`RPC: Error initializing RPC: ${ex}`);
    }
  }

  async handleVoiceChannelSelect(channelId: string) {
    if (channelId) {
      if (this.subscriptions.voice[channelId]) {
        this.subscriptions.voice[channelId].forEach(sub => sub.unsubscribe());
      }
      this.subscriptions.voice[channelId] = [
        await this.rpc.subscribe('VOICE_STATE_UPDATE', { channel_id: channelId }),
        await this.rpc.subscribe('VOICE_STATE_CREATE', { channel_id: channelId }),
        await this.rpc.subscribe('VOICE_STATE_DELETE', { channel_id: channelId }),
        await this.rpc.subscribe('SPEAKING_START', { channel_id: channelId }),
        await this.rpc.subscribe('SPEAKING_STOP', { channel_id: channelId }),
      ];
      console.log('Subscribed to voice events for channel', channelId);
    }
  }

  async addUser(newUser: userData, sendData: boolean = false) {
    const existingUserIndex = this.connectedUsers.findIndex(user => user.id === newUser.id);
    
    if (existingUserIndex !== -1) {
      this.connectedUsers[existingUserIndex] = {
        ...this.connectedUsers[existingUserIndex],
        ...newUser
      };
      if (!this.connectedUsers[existingUserIndex].profile) {
        const userId = this.connectedUsers[existingUserIndex].id;
        const userAvatar = this.connectedUsers[existingUserIndex].avatar;
      
        // Encode the image and update the user profile
        this.connectedUsers[existingUserIndex] = {
          ...this.connectedUsers[existingUserIndex],
          profile: await this.DeskThing.encodeImageFromUrl(`https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png`)
        };
      }
      if (sendData) {
        this.sendDataToClients([this.connectedUsers[existingUserIndex]], 'update')
      }
    } else {
      this.connectedUsers.push(newUser);
      if (sendData) {
        this.sendDataToClients([newUser], 'update')
      }
    }
  }
  
  async handleVoiceStateCreate(args: discordData) {
    this.addUser({
      id: args.user.id,
      username: args.user.username ?? undefined,
      nick: args.nick ?? undefined,             
      speaking: false,                          
      volume: args.volume ?? undefined,         
      mute: args.mute,
      deaf: args.voice_state.deaf || args.voice_state.self_deaf,
      avatar: args.user.avatar ?? undefined,    
      profile: undefined                               
    }, true);
  }

  async handleVoiceStateDelete(args: discordData) {
    this.connectedUsers = this.connectedUsers.filter(
      (user) => user.id !== args.user.id
    );
    this.sendDataToClients([{ id: args.user.id }], 'disconnect');
  }

  async handleVoiceStateUpdate(args: discordData) {
    this.addUser({
      id: args.user.id,
      username: args.user.username ?? undefined,
      nick: args.nick ?? undefined,             
      speaking: undefined,                          
      volume: args.volume ?? undefined,         
      mute: args.voice_state.mute || args.voice_state.self_mute,             
      deaf: args.voice_state.deaf || args.voice_state.self_deaf,
      avatar: args.user.avatar ?? undefined,    
      profile: undefined                               
    }, true);
  }

  async handleSpeakingStart(args: {user_id: string}) {
    this.addUser({
      id: args.user_id,
      speaking: true,
    })  
    this.sendDataToClients([{ id: args.user_id, speaking: true }], 'voice');
  }

  async handleSpeakingStop(args: {user_id: string}) {
    this.addUser({
      id: args.user_id,
      speaking: true,
    })
    this.sendDataToClients([{ id: args.user_id, speaking: false }], 'voice');
  }

  async handleVoiceConnectionStatus(args: discordData) {
    if (args.state === 'CONNECTING') {
      if ((await this.DeskThing.getData())?.settings?.auto_switch_view?.value) {
        this.DeskThing.sendDataToClient({
          app: 'client',
          type: 'set',
          request: 'view',
          payload: 'Discord',
        });
      }
      await this.sendDataToClients(undefined, 'join');
    }
    if (args.state === 'DISCONNECTED') {
      console.log('Unsubscribing from all voice channels');
      await this.unsubscribe();
      this.subscriptions.voice = {};
      await this.sendDataToClients(undefined, 'leave');
    }
  }

  async unsubscribe() {
    try {
      for (const channelId of Object.keys(this.subscriptions.voice)) {
        this.subscriptions.voice[channelId].forEach(sub => sub.unsubscribe());
      }
    } catch (ex) {
      await this.sendError(`Discord RPC Error during unsubscribe: ${ex}`);
    }
  }

  async setActivity() {
    try {
      if (!this.startTimestamp) {
        this.startTimestamp = new Date();
      }
      const uptimeMs = new Date().getTime() - this.startTimestamp.getTime();
      const msToTime = (duration: number) => {
        const seconds = String(Math.floor((duration / 1000) % 60)).padStart(2, '0');
        const minutes = String(Math.floor((duration / (1000 * 60)) % 60)).padStart(2, '0');
        const hours = String(Math.floor((duration / (1000 * 60 * 60)) % 24)).padStart(2, '0');
        return hours !== '00' ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
      };

      await this.rpc.setActivity({
        details: 'The Revived Car Thing',
        state: `Developing for ${msToTime(uptimeMs)}`,
        largeImageKey: 'emoji_large',
        largeImageText: 'Developing',
        smallImageKey: 'emoji_small',
        smallImageText: '37683 errors',
        instance: true,
        buttons: [
          { label: "Check Out Desk Thing", url: "https://github.com/ItsRiprod/carthing/" }
        ]
      }).catch(error => {
        console.error('Failed to set activity:', error.message);
      });
    } catch (ex) {
      await this.sendError(`Error in setActivity: ${ex}`);
    }
  }

  async setSubscribe() {
    await this.sendLog('Subscribing to voice channels and connection status');
    this.rpc.subscribe('VOICE_CHANNEL_SELECT', {});
    this.rpc.subscribe('VOICE_CONNECTION_STATUS', {});
  }

  async sendLog(message: string) {
    this.DeskThing.sendLog(message);
  }

  async sendError(message: string) {
    this.DeskThing.sendError(message); 
  }

  async sendDataToClients(payload: userData[] | notificationData | undefined, request: string = '') {
    this.DeskThing.sendDataToClient({type: 'data', request: request, payload: payload}); 
  }

  async setVoiceSetting(data: any) {
    this.rpc.setVoiceSettings(data);
    this.sendDataToClients(this.connectedUsers, 'call')
  }
  async leaveCall() {
    this.rpc.selectVoiceChannel();
  }
}

export default DiscordHandler

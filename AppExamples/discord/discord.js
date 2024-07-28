const fs = require('fs');
const path = require('path');
const RPC = require('discord-rpc');

class DiscordHandler {
  constructor(sendDataToMainFn) {
    this.client_secret = undefined;
    this.client_id = undefined;
    this.token = undefined;
    this.sendDataToMainFn = sendDataToMainFn;
    this.redirect_url = 'http://localhost:8888/callback/discord';
    this.scopes = [
      'rpc', 'messages.read', 'rpc.video.write', 'rpc.voice.read', 
      'rpc.activities.write', 'rpc.voice.write', 'rpc.screenshare.read', 
      'rpc.notifications.read', 'rpc.video.read', 'rpc.screenshare.write'
    ];
    this.settings = {
      "auto_switch_view": {
        "value": 'true',
        "label": "Auto Focus",
        "options": [
          { "value": 'false', "label": "Disabled" },
          { "value": 'true', "label": "Enabled" }
        ]
      },
      "notifications": {
        "value": 'true',
        "label": "Notifications",
        "options": [
          { "value": 'false', "label": "Disabled" },
          { "value": 'true', "label": "Enabled" }
        ]
      }
    };
    this.rpc = new RPC.Client({ transport: 'ipc' });
    this.manifestPath = path.join(__dirname, 'manifest.json');
    this.manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf-8'));
    this.subscriptions = { voice: {} };
    this.startTimestamp = null;
    this.initializeRpc();
  }

  async registerRPC(clientId) {
    try {
      await this.sendLog('Registering RPC and logging in...');
      RPC.register(clientId);
      this.rpc = new RPC.Client({ transport: 'ipc' });
      await this.login();
      await this.unsubscribe()
      this.subscriptions = { voice: {} };
      await this.initializeRpc();
    } catch (exception) {
      await this.sendError(`RPC: Error registering RPC client: ${exception.message}`);
    }
  }

  async login() {
    try {
      await this.rpc.connect(this.client_id);
      if (!this.token) {
        await this.sendLog('Authorizing! Token is null');
        this.token = await this.rpc.authorize({
          scopes: this.scopes,
          clientSecret: this.client_secret,
          redirectUri: this.redirect_url
        });
        this.sendDataToMainFn('add', { token: this.token });
      }
      this.sendLog('RPC: @login Authenticating! token is'+ this.token)
      this.rpc.authenticate(this.token)
      this.sendLog('RPC: @login Auth Successful')
    } catch (exception) {
      this.sendError(`Discord RPC Error: ${exception.message}`);
    }
  }

  async initializeRpc() {
    this.sendLog('RPC Initializing...');
    try {
      this.rpc.on('ready', async () => {
        this.sendLog('RPC ready! Setting activity and subscribing to events');
        this.setActivity();
        this.setSubscribe();
        setInterval(() => this.setActivity(), 1000);
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

      this.rpc.transport.on('close', () => {
        console.error('RPC transport closed.');
      });

      this.rpc.on('disconnected', async (closeEvent) => {
        console.warn(`Disconnected from Discord Error: ${closeEvent}`);
        await this.sendError('RPC Disconnected! Attempting to reconnect...');
        await this.login();
      });

    } catch (Exception) {
      this.sendError(`RPC: Error initializing RPC: ${Exception.message}`);
    }
  }

  async handleVoiceChannelSelect(channelId) {
    if (channelId) {
      if (this.subscriptions.voice[channelId]) {
        this.subscriptions.voice[channelId].forEach(sub => sub.unsubscribe());
      }
      this.subscriptions.voice[channelId] = [
        await this.rpc.subscribe('VOICE_STATE_UPDATE', { channel_id: channelId }),
        await this.rpc.subscribe('VOICE_STATE_CREATE', { channel_id: channelId }),
        await this.rpc.subscribe('VOICE_STATE_DELETE', { channel_id: channelId }),
        await this.rpc.subscribe('SPEAKING_START', { channel_id: channelId }),
        await this.rpc.subscribe('SPEAKING_STOP', { channel_id: channelId })
      ];
      console.log('Subscribed to voice events for channel', channelId);
    }
  }

  async handleVoiceStateCreate(args) {
    await this.sendDataToClients(args, 'connect');
    console.log(args.nick, 'Joined');
  }

  async handleVoiceStateDelete(args) {
    await this.sendDataToClients(args, 'disconnect');
    console.log(args.nick, 'Disconnected');
  }

  async handleVoiceStateUpdate(args) {
    await this.sendDataToClients(args, 'update');
    console.log(args.nick, 'Updated');
  }

  async handleSpeakingStart(args) {
    const message = this.createMessage('discord_data', 'speaking', { user_id: args.user_id, speaking: true });
    await this.sendMessageToClients(message);
  }

  async handleSpeakingStop(args) {
    const message = this.createMessage('discord_data', 'speaking', { user_id: args.user_id, speaking: false });
    await this.sendMessageToClients(message);
  }

  async handleVoiceConnectionStatus(args) {
    if (args.state === 'CONNECTING') {
      this.sendMessageToClients({ app: 'client', type: 'set_view', data: 'Discord' });
      await this.sendDataToClients({ action: 'join', data: null });
    }
    if (args.state === 'DISCONNECTED') {
      console.log("Unsubscribing from all voice channels");
      await this.unsubscribe();
      this.subscriptions.voice = {};
      await this.sendDataToClients({ action: 'leave', data: null });
    }
  }

  async unsubscribe() {
    try {
      for (const channelId of Object.keys(this.subscriptions.voice)) {
        this.subscriptions.voice[channelId].forEach(sub => sub.unsubscribe());
      }
    } catch (exception) {
      await this.sendError(`Discord RPC Error during unsubscribe: ${exception.message}`);
    }
  }

  async setActivity() {
    try {
      if (!this.startTimestamp) {
        this.startTimestamp = new Date();
      }
      const uptimeMs = new Date() - this.startTimestamp;
      const msToTime = (duration) => {
        const seconds = String(Math.floor((duration / 1000) % 60)).padStart(2, '0');
        const minutes = String(Math.floor((duration / (1000 * 60)) % 60)).padStart(2, '0');
        const hours = String(Math.floor((duration / (1000 * 60 * 60)) % 24)).padStart(2, '0');
        return hours !== '00' ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
      };

      await this.rpc.setActivity({
        type: 0,
        details: 'The Revived CarThing',
        state: `Running for ${msToTime(uptimeMs)}`,
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
    } catch (exception) {
      await this.sendError(`Error in setActivity: ${exception.message}`);
    }
  }

  async setSubscribe() {
    await this.sendLog('Subscribing to voice channels and connection status');
    this.rpc.subscribe('VOICE_CHANNEL_SELECT');
    this.rpc.subscribe('VOICE_CONNECTION_STATUS');
  }

  async sendLog(message) {
    this.sendDataToMainFn('log', message );
  }

  async sendError(message) {
    this.sendDataToMainFn('error', message );
  }

  async sendDataToClients(data, action) {
    const message = this.createMessage('discord_data', action, data);
    await this.sendMessageToClients(message);
  }

  async sendMessageToClients(message) {
    this.sendDataToMainFn('data', message);
  }

  createMessage(type, action, data) {
    return {
      type: type,
      data: {
        action: action,
        user: {
          id: data?.user?.id || null,
          username: data?.user?.username || null,
          nick: data?.nick || null,
          profile: data?.user?.id && data?.user?.avatar && `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`
        },
        ...data
      }
    };
  }
}

module.exports = DiscordHandler;

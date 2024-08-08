
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
import 'dotenv/config';
import RPC from 'discord-rpc';
import axios from 'axios';
import { sendMessageToClients, sendData } from '../../util/socketHandler.js';
import { getImageData, getGifData } from '../../util/imageUtil.js'
import { getData, setData } from '../../util/dataHandler.js'

const clientId = process.env.DISCORD_CLIENT_ID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const userId = process.env.DISCORD_USER_ID; // your userId in case you want to do you-specific actions
const subscriptions = {
  voice: {}
};
RPC.register(clientId);

const rpc = new RPC.Client({ transport: 'ipc' });
const scopes = ['messages.read', 'rpc.video.write', 'rpc.voice.read', 'rpc.activities.write', 'rpc', 'rpc.voice.write', 'rpc.screenshare.read', 'rpc.notifications.read', 'rpc.video.read', 'rpc.screenshare.write'];
const redirectUri = process.env.DISCORD_REDIR_URI;
import { setActivity, setSubscribe, sendDataToClients } from './discordUtil.js'

rpc.on('ready', async () => {
  console.log('RPC ready');

  // Set activity if needed
  setActivity(rpc);
  setSubscribe(rpc);
  //rpc.selectVoiceChannel('1042954150327107643');

  setInterval(() => {
    setActivity(rpc);
  }, 1000);
});

/*
*
*   Event Listeners
*
*/
rpc.on('VOICE_CHANNEL_SELECT', async (args) => {
  console.log(args);
  const channel_id = args.channel_id;
  if (channel_id != null) {
    if (subscriptions?.voice[channel_id]) {
      subscriptions.voice[channel_id].forEach((sub) => sub.unsubscribe());
    }
    subscriptions.voice[channel_id] = [
      await rpc.subscribe('VOICE_STATE_UPDATE', { channel_id }),
      await rpc.subscribe('VOICE_STATE_CREATE', { channel_id }),
      await rpc.subscribe('VOICE_STATE_DELETE', { channel_id }),
      await rpc.subscribe('SPEAKING_START', { channel_id }),
      await rpc.subscribe('SPEAKING_STOP', { channel_id }),
    ];
    console.log('Subscribed to', subscriptions.voice, channel_id);
  }
});

rpc.on('SPEAKING_START', async (args) => {
  console.log(args.user_id, 'Speaking');
  const message = {
    type: 'discord_data',
    data: {
      user_id: args.user_id,
      action: 'speaking',
      val: true,
      connected: true,
    }
  }
  sendMessageToClients(message);
})
rpc.on('SPEAKING_STOP', async (args) => {
  console.log(args.user_id, 'Not speaking');
  const message = {
    type: 'discord_data',
    data: {
      user_id: args.user_id,
      action: 'speaking',
      val: false,
      connected: true,
    }
  }
  sendMessageToClients(message);
})
rpc.on('VOICE_STATE_CREATE', async (args) => {
  sendDataToClients(args, 'connect');
  console.log(args.nick, 'Joined')
})
rpc.on('VOICE_STATE_DELETE', async (args) => {
  sendDataToClients(args, 'disconnect');
  console.log(args.nick, 'Disconnected')
})
rpc.on('VOICE_STATE_UPDATE', async (args) => {
  sendDataToClients(args, 'update');
  console.log(args.nick, 'Updated');
});
rpc.on('VOICE_CONNECTION_STATUS', (args) => {
  if (args.state === 'CONNECTING') {
    sendMessageToClients({ type: 'set_view', data: 'Discord' });
  }
  if (args.state === 'DISCONNECTED') {
    console.log("unsubscribing ", subscriptions.voice);
    Object.keys(subscriptions.voice).forEach((channel_id) => {
      subscriptions.voice[channel_id].forEach((sub) => sub.unsubscribe());
    });
    subscriptions.voice = {};
    sendMessageToClients({ type: 'discord_data', data: { connected: false } })
  }
});

rpc.on('error', (error) => {
  console.error('RPC Error:', error.message);
});

rpc.transport.on('close', () => {
  console.error('RPC transport closed.');
});

rpc.on('disconnected', (closeEvent) => {
  console.warn(`Disconnected from Discord (Error: ${closeEvent})`);
  console.warn('Attempting to reconnect...');
  login();
});

async function login() {
  try {

    await rpc.connect(clientId);
    let token = await getData('discordAuth');

    if (token === null) {
      console.log(redirectUri);
      token = await rpc.authorize({ scopes, clientSecret, redirectUri });
      setData('discordAuth', token);
      console.log(token);
    }
    rpc.authenticate(token);
  } catch (e) {
    console.log("Error", e)
  }
}

login();

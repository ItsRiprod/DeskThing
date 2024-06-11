/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const RPC = require('discord-rpc');
const axios = require('axios');
const { sendMessageToClients, getImageData, getGifData } = require('./socketHandler');
const { getDiscordAuthToken, setDiscordAuthToken } = require('./dataHandler')

const clientId = process.env.DISCORD_CLIENT_ID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const userId = process.env.DISCORD_USER_ID; // your userId in case you want to do you-specific actions
const subscriptions = {
  voice: {}
};
RPC.register(clientId);

const rpc = new RPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();
const scopes = ['rpc', 'messages.read', 'rpc.video.write', 'rpc.voice.read', 'rpc.activities.write', 'rpc', 'rpc.voice.write', 'rpc.screenshare.read', 'rpc.notifications.read', 'rpc.video.read', 'rpc.screenshare.write'];
const redirectUri = process.env.DISCORD_REDIR_URI; 

async function setActivity() {
    if (!rpc) {
      return;
    }
  
    rpc.setActivity({
        details: 'Listening for mute/unmute',
        state: 'TODOThing',
        startTimestamp: startTimestamp,
        largeImageKey: 'image_large',
        largeImageText: 'Hidden About Me Obtained',
        smallImageKey: 'image_small',
        smallImageText: 'Cursed About Me Obtained',
        instance: false,
    }).catch((error) => {
        console.error('Failed to set activity:', error.message);
    });
  }
async function setSubscribe() {
    if (!rpc) {
      return;
    }

    rpc.subscribe('VOICE_CHANNEL_SELECT');
    rpc.subscribe('VOICE_CONNECTION_STATUS');
}

// Event Listeners
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

const sendDataToClients = async (args, action) => {
  const userId = args.user.id;
  const avatar = args.user.avatar;
  const image = await getImageData(`https://cdn.discordapp.com/avatars/${userId}/${avatar}.webp?size=100`)
  const isMuted = args.mute || args.voice_state.mute|| args.voice_state.deaf || args.voice_state.self_mute || args.voice_state.self_deaf
  const message = {
      type: 'discord_data',
      data: {
        nick: args.nick,
        avatar_source: image,
        connected: true,
        action: action,
        speaking: false,
        user: {
          id: args.user.id,
          username: args.user.username,
        },
        muted: isMuted,
      }
  }
  sendMessageToClients(message);
}
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
    if (args.user.id === userId) {
      sendDataToClients(args, 'connect');
    } else {
      sendDataToClients(args, 'update');
    }
    console.log(args.nick, 'Updated');
  });
rpc.on('VOICE_CONNECTION_STATUS', (args) => {
    if (args.state === 'CONNECTING') {
        sendMessageToClients({type: 'set_view', data: 'discord'});
    }
    if (args.state === 'DISCONNECTED') {
        console.log("unsubscribing ", subscriptions.channel);
        Object.keys(subscriptions.voice).forEach((channel_id) => {
          subscriptions.voice[channel_id].forEach((sub) => sub.unsubscribe());
        });
        subscriptions.voice = {};
        sendMessageToClients({type: 'discord_data',data: {connected: false}})
    }
  });



rpc.on('ready', async () => {
    console.log('RPC ready');

    // Set activity if needed
    setActivity();
    setSubscribe();
    //rpc.selectVoiceChannel('1042954150327107643');

    setInterval(() => {
        setActivity();
      }, 15e3);
});

rpc.on('error', (error) => {
    console.error('RPC Error:', error.message);
});

rpc.transport.on('close', () => {
    console.error('RPC transport closed. Reconnecting...');
    rpc.login({ clientId }).catch(console.error);
});

rpc.on('disconnected', (closeEvent) => {
    console.warn(`Disconnected from Discord (code: ${closeEvent.code}, reason: ${closeEvent.reason})`);
    console.warn('Attempting to reconnect...');
    rpc.login({ clientId }).catch(console.error);
});



async function login() {
  await rpc.connect(clientId);
  let token = getDiscordAuthToken();
  if (!token) {
    token = await rpc.authorize({ scopes, clientSecret, redirectUri, prompt: 'none'})
    setDiscordAuthToken(token);
  }

  rpc.authenticate(token);

}

login();

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const RPC = require('discord-rpc');
const axios = require('axios');
const { sendMessageToClients } = require('./socketHandler');

const clientId = process.env.DISCORD_CLIENT_ID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const userId = process.env.DISCORD_USER_ID; // your userId in case you want to do you-specific actions

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
        state: 'in slither party',
        startTimestamp: startTimestamp,
        largeImageKey: 'image_large',
        largeImageText: 'tea is delicious',
        smallImageKey: 'image_small',
        smallImageText: 'i am my own pillows',
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
}
async function setVoiceActivity(userId, settings) {
    if (!rpc || !userId) {
      return;
    }
    try {
        rpc.setUserVoiceSettings(userId.toString(), settings);
        console.log('Voice settings updated successfully.');
    } catch (error) {
        console.error('Failed to update voice settings:', error.message);
    }
  }

rpc.on('VOICE_CHANNEL_SELECT', (args) => {
    console.log(args);
  if (args.channel_id) {
      rpc.subscribe('VOICE_STATE_UPDATE', { channel_id: args.channel_id });
  }
});
rpc.on('VOICE_STATE_UPDATE', (args) => {
    console.log(args);
    const voiceSettings = {
        pan: { left: 1, right: 1 },
        mute: true,
        volume: 100
    };
    const userId = args.user.id;
    const message = {
        type: 'message',
        data: args
    }
    sendMessageToClients(message);
    //setVoiceActivity(userId, voiceSettings);
  });
  
rpc.on('ready', async () => {
    console.log('RPC ready');

    // Set activity if needed
    setActivity();
    setSubscribe();
    rpc.selectVoiceChannel('1042954150327107643');

    setInterval(() => {
        setActivity();
      }, 15e3);
});

//rpc.on('error', (error) => {
//    console.error('RPC Error:', error.message);
//});
//
//rpc.transport.on('close', () => {
//    console.error('RPC transport closed. Reconnecting...');
//    rpc.login({ clientId }).catch(console.error);
//});
//
//rpc.on('disconnected', (closeEvent) => {
//    console.warn(`Disconnected from Discord (code: ${closeEvent.code}, reason: ${closeEvent.reason})`);
//    console.warn('Attempting to reconnect...');
//    rpc.login({ clientId }).catch(console.error);
//});

rpc.login({ clientId, clientSecret, scopes, redirectUri }).catch(console.error);

import 'dotenv/config';
import RPC from 'discord-rpc';
import axios from 'axios';
import { sendMessageToClients } from '../../util/socketHandler.js';
import { getImageData, getGifData } from '../../util/imageUtil.js'
import { getData, setData } from '../../util/dataHandler.js'

const startTimestamp = new Date();

export async function setActivity(rpc) {
  if (!rpc) {
    return;
  }

  const currentTime = new Date();
  const uptimeMs = Math.floor((currentTime - startTimestamp)); // Calculate uptime in minutes
  const msToTime = (duration) => {
    let seconds = parseInt(String((duration / 1000) % 60), 10);
    let minutes = parseInt(String((duration / (1000 * 60)) % 60), 10);
    const hours = parseInt(String((duration / (1000 * 60 * 60)) % 24), 10);
  
    const renderedHours = hours === 0 ? '' : `${hours}:`;
    minutes = hours > 0 && minutes < 10 ? `0${minutes}` : minutes;
    seconds = seconds < 10 ? `0${seconds}` : seconds;
  
    return `${renderedHours}${minutes}:${seconds}`;
  };

  rpc.setActivity({
      details: 'The Revived CarThing',
      state: `Running for ${msToTime(uptimeMs)}`,
      largeImageKey: 'emoji_large', // This MUST match the file name in your bot app⚠️
      largeImageText: 'Developing',
      smallImageKey: 'emoji_small', // This MUST match the file name in your bot app⚠️
      smallImageText: '37683 errors',
      instance: true,
      buttons: [
        {label: "Check Out Desk Thing", url: "https://github.com/ItsRiprod/carthing/" },
      ],
  }).catch((error) => {
      console.error('Failed to set activity:', error.message);
  });
}
export async function setSubscribe(rpc) {
  if (!rpc) {
    return;
  }

  rpc.subscribe('VOICE_CHANNEL_SELECT');
  rpc.subscribe('VOICE_CONNECTION_STATUS');
}

export const sendDataToClients = async (args, action) => {
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


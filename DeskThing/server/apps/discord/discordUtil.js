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

  rpc.setActivity({
      details: 'Listening for mute/unmute',
      state: 'Something Probably',
      startTimestamp: startTimestamp,
      largeImageKey: 'emoji_large',
      largeImageText: 'Hidden About Me Obtained',
      smallImageKey: 'emoji_small',
      smallImageText: 'Cursed About Me Obtained',
      instance: false,
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


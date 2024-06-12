import axios from 'axios';
import { refreshAccessToken } from './server.js';
import { getData, setData } from './dataHandler.js'

const baseUrl = 'https://api.spotify.com/v1/me/player';

const handleError = async (error) => {
  if (error.response && error.response.status === 401) {
    try {
      await refreshAccessToken();
    } catch (refreshError) {
      console.error('Error refreshing token:', refreshError);
      throw refreshError;
    }
  } else {
    console.error('Spotify API error:', error);
    throw error;
  }
};

const makeRequest = async (method, url, data = null) => {
  try {
    let access_token = await getData('spotifyToken');
    if (!access_token) {
      await refreshAccessToken();
      throw new Error('Access token is not available. Please authenticate first.');
    }

    const headers = {
      'Authorization': `Bearer ${access_token}`,
    };

    try {
      if (method == 'get') {
        const response = await axios.get(url, {
          headers,
        });
        return response.data;
      } else if (method == 'put') {
        const response = await axios.put(url, data, {
          headers,
        });
        return response.data;
      } else if (method == 'post') {
        const response = await axios.post(url, data, {
          headers,
        });
        return response.data;
      } else {
        console.log("Unknown error");
      }
    } catch (error) {
      await handleError(error);
    }
  } catch (Error) {
    console.error(error.message);
    return null;
  }
};
const getCurrentPlayback = async () => {
  const url = `${baseUrl}/currently-playing`;
  return makeRequest('get', url);
};

const getCurrentDevice = async () => {
  const url = baseUrl;
  return makeRequest('get', url);
};

const skipToNext = async () => {
  const url = `${baseUrl}/next`;
  return makeRequest('post', url);
};

const skipToPrev = async () => {
  const url = `${baseUrl}/previous`;
  return makeRequest('post', url);
};

const play = async (uri, context, position) => {
  const url = `${baseUrl}/play`;
  const body = position && uri ? { context_uri: context, offset: { uri }, position_ms: position } : null;
  return makeRequest('put', url, body);
};

const seek = async (position) => {
  const url = `${baseUrl}/seek?position_ms=${position}`;
  return makeRequest('put', url);
};

const pause = async () => {
  const url = `${baseUrl}/pause`;
  return makeRequest('put', url);
};

const setVolume = async (newVol) => {
  const url = `${baseUrl}/volume?volume_percent=${newVol}`;
  return makeRequest('put', url);
};

export {
  getCurrentPlayback,
  getCurrentDevice,
  skipToNext,
  play,
  pause,
  skipToPrev,
  seek,
  setVolume,
};


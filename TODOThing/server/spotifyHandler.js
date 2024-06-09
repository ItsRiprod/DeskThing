/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');
const { refreshAccessToken, getSpotifyAccessToken } = require('./server');
require('dotenv').config();
  

  const getCurrentPlayback = async () => {
    try {
      // Ensure access_token is available and valid
      const access_token = await getSpotifyAccessToken();
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
  
      const api_url = 'https://api.spotify.com/v1/me/player/currently-playing';
  
      const response = await axios.get(api_url, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
  
      return response.data;
    } catch (error) {
      // Handle token expiration and refresh
      if (error.response && error.response.status === 401) {
        try {
          await refreshAccessToken();
          return await getCurrentPlayback();
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw refreshError;
        }
      } else {
        console.error('Error getting current playback:', error);
        throw error;
      }
    }
  };
  const getCurrentDevice = async () => {
    try {
      const access_token = await getSpotifyAccessToken();
      // Ensure access_token is available and valid
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
  
      const api_url = 'https://api.spotify.com/v1/me/player';
  
      const response = await axios.get(api_url, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
  
      return response.data;
    } catch (error) {
      // Handle token expiration and refresh
      if (error.response && error.response.status === 401) {
        try {
          await refreshAccessToken();
          return await getCurrentDevice();
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw refreshError;
        }
      } else {
        console.error('Error getting current playback:', error);
        throw error;
      }
    }
  };
 
  const skipToNext = async () => {
    const access_token = await getSpotifyAccessToken();
    try {
      // Ensure access_token is available and valid
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
      const api_url = 'https://api.spotify.com/v1/me/player/next';
  
      await axios.post(api_url, null, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      return { success: true };
    } catch (error) {
      // Handle token expiration and refresh
      if (error.response && error.response.status === 401) {
        try {
          console.error("Error skipping track", error.response.data.error);
          await refreshAccessToken();
          return await skipToNext();
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw refreshError;
        }
      } else {
        console.error('Error skipping to next track:', error);
        throw error;
      }
    }
  };

  const skipToPrev = async () => {
    const access_token = await getSpotifyAccessToken();
    try {
      // Ensure access_token is available and valid
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
      const api_url = 'https://api.spotify.com/v1/me/player/previous';
  
      await axios.post(api_url, null, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
  
      return { success: true };
    } catch (error) {
      // Handle token expiration and refresh
      if (error.response && error.response.status === 401) {
        try {
          console.error("Error skipping to previous track", error.response.data.error);
          await refreshAccessToken();
          return await skipToPrev();
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw refreshError;
        }
      } else {
        console.error('Error skipping to previous track:', error);
        throw error;
      }
    }
  };
  
  const play = async (uri, context, position) => {
    const access_token = await getSpotifyAccessToken();
    try {
      // Ensure access_token is available and valid
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
      const api_url = 'https://api.spotify.com/v1/me/player/play';
      
      const body = position && uri ? { context_uri: context, offset: {"uri": uri}, position_ms: position } : null;

      await axios.put(api_url, body, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
  
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };
  const seek = async (position) => {
    const access_token = await getSpotifyAccessToken();
    try {
      // Ensure access_token is available and valid
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
      const api_url = 'https://api.spotify.com/v1/me/player/seek?position_ms=' + position;
      
      const body = null ;

      await axios.put(api_url, body, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
  
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };
  const pause = async () => {
    const access_token = await getSpotifyAccessToken();
    try {
      // Ensure access_token is available and valid
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
      const api_url = 'https://api.spotify.com/v1/me/player/pause';
      

      await axios.put(api_url, null, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
  
      return { success: true };
    } catch (error) {
      // Handle token expiration and refresh
      return { success: false };
    }
  };
  const setVolume = async ( newVol ) => {
    const access_token = await getSpotifyAccessToken();
    try {
      // Ensure access_token is available and valid
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
      const api_url = `https://api.spotify.com/v1/me/player/volume?volume_percent=${newVol}`;
      
      await axios.put(api_url, null, {
        headers: {
          'Authorization': `Bearer ${access_token}`
          }
          });
        console.log("New volume set to", newVol);
  
      return { success: true };
    } catch (error) {
      // Handle token expiration and refresh
      return { success: false };
    }
  };

  module.exports = {
    getCurrentPlayback,
    getCurrentDevice,
    skipToNext,
    play,
    pause,
    skipToPrev,
    seek,
    setVolume,
  };


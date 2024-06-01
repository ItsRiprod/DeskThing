/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');
const qs = require('qs');
const express = require('express');
const app = express();
require('dotenv').config();

const client_id = process.env.SPOTIFY_API_ID; // Your client id
const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI; // Your redirect uri

let access_token = null;
let refresh_token = null;

app.get('/login', (req, res) => {
    const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
    const auth_url = 'https://accounts.spotify.com/authorize?' +
      qs.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri
      });
    res.redirect(auth_url);
  });
  
  // Step 2: Callback route to handle the authorization code and exchange it for access and refresh tokens
  app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const token_url = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
      client_id: client_id,
      client_secret: client_secret
    });
    try {
      const response = await axios.post(token_url, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      access_token = response.data.access_token;
      refresh_token = response.data.refresh_token;
      res.send('Authorization successful. You can close this tab.');
    } catch (error) {
      console.error('Error getting tokens:', error);
      res.send('Error getting tokens.');
    }
  });
  
  // Step 3: Refresh the access token if needed
  const refreshAccessToken = async () => {
    const token_url = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: client_id,
      client_secret: client_secret
    });
    try {
      const response = await axios.post(token_url, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      access_token = response.data.access_token;
      return access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  };

  const getCurrentPlayback = async () => {
    try {
      // Ensure access_token is available and valid
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
  
  const play = async (uri, position) => {
    try {
      // Ensure access_token is available and valid
      if (!access_token) {
        throw new Error('Access token is not available. Please authenticate first.');
      }
      const api_url = 'https://api.spotify.com/v1/me/player/play';
      
      const body = uri ? { context_uri: uri, position_ms: position || 0 } : null;

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

  module.exports = {
    getCurrentPlayback,
    getCurrentDevice,
    skipToNext,
    play,
    pause,
    skipToPrev
  };

  const port = process.env.PORT || 8888;
  app.listen(port, async () => {
    console.log(`Server is running on port ${port}.`);
  
    // Automatically open the default web browser
    try {
        const open = (await import('open')).default;
        await open(`http://localhost:${port}/login`);
      } catch (err) {
        console.error('Error opening browser:', err);
      }
  });
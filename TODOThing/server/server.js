/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');
const qs = require('qs');
const express = require('express');
const app = express();
var http = require('http')
var OAuth = require('oauth').OAuth
var url = require('url')
const { setTrelloAccessToken, getTrelloAccessToken, setTrelloTokenSecret, getTrelloTokenSecret, setSpotifyAccessToken, getSpotifyAccessToken, } = require('./dataHandler.js');

/*
* If you do not have a MIDI keyboard OR MIDI Launchpad Mk2, then I would recommend setting this to FALSE.
* I do have both of those, and this server will interact with them through ./launchpadHandler
* disabling this will prevent that portion of code from running
*/
const ENABLE_MIDI_DEVICES = true;

require('dotenv').config();

const client_id = process.env.SPOTIFY_API_ID; // bot id
const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // bot secret
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI; // redirect uri (localhost)

const trello_callback = process.env.TRELLO_REDIRECT_URI; // redirect uri (localhost)
const trello_key = process.env.TRELLO_KEY; // trello app key
const trello_secret = process.env.TRELLO_SECRET; // trello app secret

const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "TODOThing";
const scope = 'read,write';
const expiration = '30days';
const oauth_secrets = {};
const oauth = new OAuth(requestURL, accessURL, trello_key, trello_secret, "1.0A", trello_callback, "HMAC-SHA1")




let trello_token, trello_tokenSecret;

let refresh_token = null;

const getSpotifyRefreshToken = () => {
    return refresh_token;
}
const getTrelloOauth = () => {
    return oauth;
}

/*

Spotify Authentication

*/
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
      const response = await axios.post(token_url, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const access_token = response.data.access_token;
      refresh_token = response.data.refresh_token;

      if (access_token && refresh_token) {
        res.send('Spotify Authorized!');
      setSpotifyAccessToken(access_token);
      } else {
        console.error('Error getting tokens:', response.data);
        res.send('Error getting tokens.');
      }
  });

/*

Trello Authentication

*/

const login = function(request, response) {
    oauth.getOAuthRequestToken(function(error, token, tokenSecret, results){
      oauth_secrets[token] = tokenSecret;
      response.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
  };
const callback = function(req, res) {
    
    const query = url.parse(req.url, true).query;
    const token = query.oauth_token;
    const tokenSecret = oauth_secrets[token];
    const verifier = query.oauth_verifier;
    oauth.getOAuthAccessToken(token, tokenSecret, verifier, function(error, accessToken, accessTokenSecret, results){
      // In a real app, the accessToken and accessTokenSecret should be stored
      setTrelloAccessToken(accessToken);
      setTrelloTokenSecret(accessTokenSecret);
      console.log(trello_token, trello_tokenSecret);
      res.send("Authenticated!");
      //oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, function(error, data, response){
      //  // Now we can respond with data to show that we have access to your Trello account via OAuth
      //  res.send(data)
      //});
    });
  };

app.get('/trello/login', async (req, res) => {
    login(req, res);
});

app.get('/trello/callback', async (req, res) => {
    callback(req, res);
});


const refreshAccessToken = async () => {
  if (!refresh_token) {
    try {
      const open = (await import('open')).default;
      await open(`http://localhost:${port}/login`);
    } catch (err) {
      console.error('Error opening browser:', err);
    }
  }
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
      const access_token = response.data.access_token;
      setSpotifyAccessToken(access_token);
      return access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  };

  const port = process.env.PORT || 8881;
  app.listen(port, async () => {
    console.log(`Server is running on port ${port}.`);
  
    // Automatically open the default web browser
    //try {
    //    const open = (await import('open')).default;
    //    await open(`http://localhost:${port}/login`);
    //  } catch (err) {
    //    console.error('Error opening browser:', err);
    //  }
  });

  module.exports = {
    getSpotifyRefreshToken,
    getSpotifyAccessToken,
    getTrelloAccessToken,
    getTrelloTokenSecret,
    refreshAccessToken,
    getTrelloOauth,
  };

require('./socketHandler');
require('./spotifyHandler');
if (ENABLE_MIDI_DEVICES)
  require('./launchpadHandler');
const { refreshTrelloToken } = require('./trelloHandler');
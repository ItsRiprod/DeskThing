/* eslint-disable @typescript-eslint/no-var-requires */
// Environment Variables
import 'dotenv/config';

// Authentication Server
import axios from 'axios'
const post = axios.post;
import { stringify } from 'qs';
import express from 'express';
const app = express();
import { OAuth } from 'oauth';
import { parse, fileURLToPath, pathToFileURL } from 'url';

// Importing utility functions
await import('./util/socketHandler.js');

// Server IO reads
import { getData, setData } from './util/dataHandler.js';

// For loading modules
import fs from 'fs';
import path from 'path';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

// Function to load modules dynamically based on config
const loadModules = async () => {
  const configPath = path.join(__dirname, 'app_config.json');
  
  if (!fs.existsSync(configPath)) {
      console.error('Config file not found at directory ', configPath);
      process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
   
  if (!config.modules || !Array.isArray(config.modules)) {
      console.error('Invalid config format');
      process.exit(1);
  }
  
  for (const moduleName of config.modules) {
      const modulePath =  path.join(__dirname, `apps/${moduleName}/${moduleName}Handler.js`);
      if (fs.existsSync(modulePath)) {
          try {
            const moduleURL = pathToFileURL(modulePath).href;
              console.log(`Loading ${moduleURL} module...`);
              await import(moduleURL);
              console.log(`${moduleName} module loaded`);
            } catch (err) {
              console.error(`Failed to load ${moduleName} module:`, err);
          }
      } else {
          console.warn(`Module ${moduleName} does not exist!`);
      }
  }
};

const client_id = process.env.SPOTIFY_API_ID; // bot id
const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // bot secret
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI; // redirect uri (localhost)

const trello_callback = process.env.TRELLO_REDIRECT_URI; // redirect uri (localhost)
const trello_key = process.env.TRELLO_KEY; // trello app key
const trello_secret = process.env.TRELLO_SECRET; // trello app secret

const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
const discordRedirectUri = process.env.DISCORD_REDIR_URI; 

const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "TODOThing";
const scope = 'read,write';
const expiration = '30days';
const oauth_secrets = {};
const oauth = new OAuth(requestURL, accessURL, trello_key, trello_secret, "1.0A", trello_callback, "HMAC-SHA1")

const getTrelloOauth = () => {
    return oauth;
}

/*

Spotify Authentication

*/
app.get('/login', (req, res) => {
    const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
    console.log("Redirect Uri: ", redirect_uri)
    const auth_url = 'https://accounts.spotify.com/authorize?' +
      stringify({
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
      const response = await post(token_url, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const access_token = response.data.access_token;
      const refresh_token = response.data.refresh_token;

      if (access_token && refresh_token) {
        res.send('Spotify Authorized!');
        setData('spotifyToken', access_token);
        setData('refreshToken', refresh_token);
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
    
    const query = parse(req.url, true).query;
    const token = query.oauth_token;
    const tokenSecret = oauth_secrets[token];
    const verifier = query.oauth_verifier;
    oauth.getOAuthAccessToken(token, tokenSecret, verifier, function(error, accessToken, accessTokenSecret, results){
      // In a real app, the accessToken and accessTokenSecret should be stored
      setData('trelloAccessToken', accessToken);
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

app.get('/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
      return res.status(400).send('Authorization code missing');
  }
  
  try {
      // Call Discord's token endpoint to exchange code for token
      const response = await post('https://discord.com/api/oauth2/token', {
          client_id: discordClientId,
          client_secret: discordClientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: discordRedirectUri,
      });

      // Handle successful authentication here if needed
      console.log('Authentication successful:', response.data);
      res.send('Authentication successful! You can close this tab now.');

  } catch (error) {
      console.error('Failed to authenticate:', error.message);
      res.status(500).send('Failed to authenticate. Please try again later.');
  }
});


const startServer = async () => {
  await loadModules();

  const port = process.env.PORT || 8888;
  app.listen(port, () => {
      console.log(`Server is running on port ${port}.`);
  });
};

startServer();


  

  export {
    getTrelloOauth,
  };
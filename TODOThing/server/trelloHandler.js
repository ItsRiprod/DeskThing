/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */

const axios = require('axios');
const serverModule = require('./server.js');
const { setTrelloAccessToken, getTrelloAccessToken, setTrelloTokenSecret, getTrelloTokenSecret, } = require('./dataHandler.js');

const getTrelloOauth = serverModule.getTrelloOauth;
const trello_key = process.env.TRELLO_KEY; // trello app key

const port = process.env.PORT || 8888;
const refreshTrelloToken = async () => {
  try {
    const open = (await import('open')).default;
    await open(`http://localhost:${port}/trello/login`);
  } catch (err) {
    console.error('Error opening browser:', err);
  }
};

const getTrelloBoards = async () => {
  
  try {
    const oauth = getTrelloOauth();
    const accessToken = getTrelloAccessToken();
    const accessTokenSecret = getTrelloTokenSecret();
  
    return new Promise((resolve, reject) => {
      oauth.getProtectedResource(
        "https://api.trello.com/1/members/me/boards",
        "GET",
        accessToken,
        accessTokenSecret,
        function (error, data, response) {
          if (error) {
            console.error("Error getting Trello boards:", error);
            if (error.statusCode === 401) {
              console.log("Access token expired. Refreshing...");
              refreshTrelloToken();
            }
            reject(error);
            return new Error(error);
          }

          // Assuming the response data is an array of board objects
          if (data && data.length > 0) {
            resolve(data);
          } else {
            console.log("No boards found.");
            resolve([]);
          }
        }
      );
    });
  } catch (error) {

    console.error("There was an error getting trello boards", error);
    throw error;
  }
}

module.exports = {
  getTrelloBoards,
  refreshTrelloToken,
};
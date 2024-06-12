/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const serverModule = require('./server.js');
const { setTrelloPreferences, getTrelloAccessToken, getTrelloPreferences, getTrelloTokenSecret, } = require('./dataHandler.js');

const getTrelloOauth = serverModule.getTrelloOauth;

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
const getTrelloOrganizations = async () => {
  
  try {
    const oauth = getTrelloOauth();
    const accessToken = getTrelloAccessToken();
    const accessTokenSecret = getTrelloTokenSecret();
  
    return new Promise((resolve, reject) => {
      oauth.getProtectedResource(
        "https://api.trello.com/1/members/me/organizations",
        "GET",
        accessToken,
        accessTokenSecret,
        function (error, data, response) {
          if (error) {
            console.error("Error getting Trello organizations:", error);
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
            console.log("No organizations found.");
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
const getTrelloBoardsFromOrganization = async (orgId) => {
  
  try {
    const oauth = getTrelloOauth();
    const accessToken = getTrelloAccessToken();
    const accessTokenSecret = getTrelloTokenSecret();
    const id = orgId;
    return new Promise((resolve, reject) => {
      oauth.getProtectedResource(
        `https://api.trello.com/1/organizations/${id}/boards`,
        "GET",
        accessToken,
        accessTokenSecret,
        function (error, data, response) {
          if (error) {
            console.error("Error getting Trello boards from org:", error);
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
const getTrelloCardsFromBoard = async (boardId) => {
  
  try {
    const oauth = getTrelloOauth();
    const accessToken = getTrelloAccessToken();
    const accessTokenSecret = getTrelloTokenSecret();
    const id = boardId;
    return new Promise((resolve, reject) => {
      oauth.getProtectedResource(
        `https://api.trello.com/1/boards/${id}/cards`,
        "GET",
        accessToken,
        accessTokenSecret,
        function (error, data, response) {
          if (error) {
            console.error("Error getting Trello cards from board:", error);
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
            console.log("No cards found.");
            resolve([]);
          }
        }
      );
    });
  } catch (error) {

    console.error("There was an error getting trello cards", error);
    throw error;
  }
}
const getTrelloCardsFromList = async (listId) => {
  
  try {
    const oauth = getTrelloOauth();
    const accessToken = getTrelloAccessToken();
    const accessTokenSecret = getTrelloTokenSecret();
    const id = listId;
    return new Promise((resolve, reject) => {
      oauth.getProtectedResource(
        `https://api.trello.com/1/lists/${id}/cards`,
        "GET",
        accessToken,
        accessTokenSecret,
        function (error, data, response) {
          if (error) {
            console.error("Error getting Trello cards from list:", error);
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
            console.log("No cards found.");
            resolve([]);
          }
        }
      );
    });
  } catch (error) {

    console.error("There was an error getting trello cards", error);
    throw error;
  }
}
const getTrelloListsFromBoard = async (boardId) => {
  
  try {
    const oauth = getTrelloOauth();
    const accessToken = getTrelloAccessToken();
    const accessTokenSecret = getTrelloTokenSecret();
    const id = boardId;
    return new Promise((resolve, reject) => {
      oauth.getProtectedResource(
        `https://api.trello.com/1/boards/${id}/lists`,
        "GET",
        accessToken,
        accessTokenSecret,
        function (error, data, response) {
          if (error) {
            console.error("Error getting Trello lists:", error);
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
            console.log("No lists found.");
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.error("There was an error getting trello lists", error);
    throw error;
  }
}
const getTrelloLabelsFromBoard = async (boardId) => {
  
  try {
    const oauth = getTrelloOauth();
    const accessToken = getTrelloAccessToken();
    const accessTokenSecret = getTrelloTokenSecret();
    const id = boardId;
    return new Promise((resolve, reject) => {
      oauth.getProtectedResource(
        `https://api.trello.com/1/boards/${id}/labels`,
        "GET",
        accessToken,
        accessTokenSecret,
        function (error, data, response) {
          if (error) {
            console.error("Error getting Trello labels:", error);
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
            console.log("No labels found.");
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.error("There was an error getting trello labels", error);
    throw error;
  }
}

const getTrelloPrefs = async () => {
  try {
    const preferences = getTrelloPreferences();
    return preferences;
  } catch (error) {
    console.error("There was an error getting trello preferences from file", error);
    throw error;
  }
}
const setTrelloPrefs = async (pref) => {
  try {
    setTrelloPreferences(pref);
    return {success: true};
  } catch (error) {
    console.error("There was an error getting trello preferences from file", error);
    throw error;
  }
}

const addListToPref = (data) => {
  const preferences = getTrelloPreferences();

  // Check if preferences.lists exists
  if (!preferences.lists) {
    // If it doesn't exist, create an empty array
    preferences.lists = [];
  }

  // Add the data to the lists array
  preferences.lists.push(data);

  // Update the preferences
  setTrelloPreferences(preferences);
};

const removeListFromPref = (listId) => {
  const preferences = getTrelloPreferences();
  const listIndex = preferences.lists.findIndex(list => list.id === listId);

  if (listIndex === -1) {
    throw new Error(`List with ID ${listId} not found in preferences.`);
  }

  preferences.lists.splice(listIndex, 1);
  setTrelloPreferences(preferences);
}

module.exports = {
  getTrelloBoards,
  refreshTrelloToken,
  getTrelloCardsFromBoard,
  getTrelloCardsFromList,
  getTrelloListsFromBoard,
  getTrelloBoardsFromOrganization,
  getTrelloOrganizations,
  getTrelloPrefs,
  setTrelloPrefs,
  addListToPref,
  removeListFromPref,
  getTrelloLabelsFromBoard,
};
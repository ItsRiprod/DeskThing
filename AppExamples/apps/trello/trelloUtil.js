/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
import 'dotenv/config';
import { getTrelloOauth } from '../../server.js';
import { getData, setData } from '../../util/dataHandler.js';

const refreshTrelloToken = async () => {
  try {
    const open = (await import('open')).default;
    await open(`http://localhost:${process.env.PORT || 8888}/trello/login`);
  } catch (err) {
    console.error('Error opening browser:', err);
  }
};

const makeRequest = async (url, method, body = null) => {
  try {
    let accessToken = getData('trelloAccessToken');
    const oauth = getTrelloOauth();
    const accessTokenSecret = process.env.TRELLO_SECRET; 
    if (!accessToken) {
      await refreshTrelloToken();
      accessToken = getData('trelloAccessToken');
    }
    console.log(`${method} ${url} with the access token: ${accessToken} and secret: ${accessTokenSecret} and body ${body}`)
    return new Promise((resolve, reject) => {
      oauth.getProtectedResource(
          url, 
          method, 
          accessToken,
          accessTokenSecret, (error, data, response) => {
        if (error) {
          console.error(`Error making Trello request to ${url}:`, error);
          if (error.statusCode === 401) {
            console.log('Access token expired. Refreshing...');
            refreshTrelloToken();
          }
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  } catch(error) {
    console.error("There was an error getting trello information", error);
    throw error.message;
  }
};

const getTrelloBoards = async () => {
  const url = 'https://api.trello.com/1/members/me/boards';

  try {
    const data = await makeRequest(url, 'GET');
    return data && data.length > 0 ? data : [];
  } catch (error) {
    console.error('Error getting Trello boards:', error);
    throw error;
  }
};

const getTrelloOrganizations = async () => {
  const url = 'https://api.trello.com/1/members/me/organizations';

  try {
    const data = await makeRequest(url, 'GET');
    return data && data.length > 0 ? data : [];
  } catch (error) {
    console.error('Error getting Trello organizations:', error);
    throw error;
  }
};

const getTrelloBoardsFromOrganization = async (orgId) => {
  const url = `https://api.trello.com/1/organizations/${orgId}/boards`;

  try {
    const data = await makeRequest(url, 'GET');
    return data && data.length > 0 ? data : [];
  } catch (error) {
    console.error('Error getting Trello boards from organization:', error);
    throw error;
  }
};

const getTrelloCardsFromBoard = async (boardId) => {
  const url = `https://api.trello.com/1/boards/${boardId}/cards`;

  try {
    const data = await makeRequest(url, 'GET');
    return data && data.length > 0 ? data : [];
  } catch (error) {
    console.error('Error getting Trello cards from board:', error);
    throw error;
  }
};

const getTrelloCardsFromList = async (listId) => {
  const url = `https://api.trello.com/1/lists/${listId}/cards`;

  try {
    const data = await makeRequest(url, 'GET');
    return data && data.length > 0 ? data : [];
  } catch (error) {
    console.error('Error getting Trello cards from list:', error);
    throw error;
  }
};

const getTrelloListsFromBoard = async (boardId) => {
  const url = `https://api.trello.com/1/boards/${boardId}/lists`;

  try {
    const data = await makeRequest(url, 'GET');
    return data && data.length > 0 ? data : [];
  } catch (error) {
    console.error('Error getting Trello lists from board:', error);
    throw error;
  }
};

const getTrelloLabelsFromBoard = async (boardId) => {
  const url = `https://api.trello.com/1/boards/${boardId}/labels`;

  try {
    const data = await makeRequest(url, 'GET');
    return data && data.length > 0 ? data : [];
  } catch (error) {
    console.error('Error getting Trello labels from board:', error);
    throw error;
  }
};

const getTrelloPrefs = async () => {
  try {
    const preferences = getData('trelloPreferences');
    return preferences || {};
  } catch (error) {
    console.error('Error getting Trello preferences from file:', error);
    throw error;
  }
};

const setTrelloPrefs = async (pref) => {
  try {
    setData('trelloPreferences', pref);
    return { success: true };
  } catch (error) {
    console.error('Error setting Trello preferences in file:', error);
    throw error;
  }
};

const addListToPref = async (data) => {
  const preferences = await getTrelloPrefs();

  if (!preferences.lists) {
    preferences.lists = [];
  }

  console.log("Old Pref", preferences)
  preferences.lists.push(data);
  setTrelloPrefs(preferences);
  console.log("New Pref", preferences)
};

const removeListFromPref = async (listId) => {
  const preferences = await getTrelloPrefs();
  const listIndex = preferences.lists.findIndex((list) => list.id === listId);

  if (listIndex === -1) {
    throw new Error(`List with ID ${listId} not found in preferences.`);
  }

  preferences.lists.splice(listIndex, 1);
  setTrelloPrefs(preferences);
};

export {
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
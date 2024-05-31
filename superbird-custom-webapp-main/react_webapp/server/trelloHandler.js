/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');
const apiKey = process.env.TRELLO_API_KEY;
const token = process.env.TRELLO_TOKEN;
const memberId = process.env.TRELLO_MEMBER_ID;

//TODO: Actually do all of this
const getTrelloBoards = async () => {
  try {

    const response = await axios.get(`https://api.trello.com/1/members/${memberId}/boards`, {
      params: {
        key: apiKey,
        token: token,
        fields: 'name,url',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching Trello boards:', error);
    throw error;
  }
};
const getTrelloCards = async (boardId, listId) => {
  try {
    const apiKey = process.env.TRELLO_API_KEY;
    const token = process.env.TRELLO_TOKEN;

    const response = await axios.get(`https://api.trello.com/1/lists/${listId}/cards`, {
      params: {
        key: apiKey,
        token: token,
        fields: 'name,url,desc,due',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching Trello cards:', error);
    throw error;
  }
};

module.exports = {
  getTrelloBoards,
  getTrelloCards,
};

module.exports = {
  getTrelloBoards,
  getTrelloCards,
};
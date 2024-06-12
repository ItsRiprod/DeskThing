
import { removeListFromPref, addListToPref, getTrelloPrefs, setTrelloPrefs, getTrelloBoards, getTrelloLabelsFromBoard, getTrelloCardsFromBoard, getTrelloCardsFromList, getTrelloListsFromBoard, getTrelloBoardsFromOrganization, getTrelloOrganizations } from './trelloUtil.js';
import { server, sendError } from '../../util/socketHandler.js'

server.on('connection', async (socket) => {
  socket.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.app == 'trello') {
        switch (parsedMessage.type) {
          case 'get':
            await handleGetRequest(socket, parsedMessage);
            break;
          case 'set':
            await handleSetRequest(socket, parsedMessage);
            break;
          default:
            console.log('Unknown type', parsedMessage.type);
            break;
        }
      }
    } catch (e) {
      console.log('There was an error in SpotifyHandler');
    }
  })
})

const handleGetRequest = async (socket, parsedMessage) => {
  try {
    switch (parsedMessage.request) {
      case 'boards_info':
        if (parsedMessage.request) {
          const boards = await getTrelloBoards();
          socket.send(
            JSON.stringify({ type: 'trello_board_data', data: boards })
          );
        } else {
          await sendError(socket, 'boards_info request is missing data')
        }
        break;
      case 'org_info':
        if (parsedMessage.request) {

          const orgs = await getTrelloOrganizations();

          socket.send(
            JSON.stringify({ type: 'trello_org_data', data: orgs })
          );
        } else {
          await sendError(socket, 'org_info request is missing data')
        }
        break;
      case 'boards_from_org':

        if (parsedMessage.data.id) {
          const boards = await getTrelloBoardsFromOrganization(parsedMessage.data.id);
          socket.send(
            JSON.stringify({ type: 'trello_board_data', data: boards })
          );
        } else {
          await sendError(socket, 'boards_from_org request is missing data')
        }

        break;
      case 'cards_from_board':

        if (parsedMessage.data.id) {

          const boardId = parsedMessage.data.id;
          const cards = await getTrelloCardsFromBoard(boardId)
          socket.send(
            JSON.stringify({ type: 'trello_card_data', data: cards })
          );
        } else {
          await sendError(socket, 'cards_from_board request is missing data')
        }
        break;
      case 'lists_from_board':

        if (parsedMessage.data.id) {

          const boardId = parsedMessage.data.id;
          const lists = await getTrelloListsFromBoard(boardId)
          socket.send(
            JSON.stringify({ type: 'trello_list_data', data: lists })
          );
        } else {
          await sendError(socket, 'lists_from_board request is missing data')
        }
        break;
      case 'labels_from_board':

        if (parsedMessage.data.id) {

          const boardId = parsedMessage.data.id;
          const labels = await getTrelloLabelsFromBoard(boardId);
          console.log(labels);
          socket.send(
            JSON.stringify({ type: 'trello_label_data', data: labels })
          );
        } else {
          await sendError(socket, 'labels_from_board request is missing data')
        }
        break;
      case 'cards_from_list':

        if (parsedMessage.data.id) {

          const listId = parsedMessage.data.id;
          const cards = await getTrelloCardsFromList(listId)
          socket.send(
            JSON.stringify({ type: 'trello_card_data', data: cards })
          );
        } else {
          await sendError(socket, 'cards_from_list request is missing data')
        }
        break;
      case 'trello_pref_info':
        if (parsedMessage) {
          const preferences = await getTrelloPrefs();
          socket.send(
            JSON.stringify({ type: 'trello_pref_data', data: preferences })
          );
        } else {
          await sendError(socket, 'trello_pref_info request is missing data')
        }
        break;
      case 'trello_pref_list_info':
        if (parsedMessage) {

          const prefs = await getTrelloPrefs();
          socket.send(
            JSON.stringify({ type: 'trello_pref_list_data', data: prefs })
          );
        } else {
          await sendError(socket, 'trello_pref request is missing data')
        }

        break;
      default:
        break;
    }
  } catch (e) {
    console.error('TRELLO: Error in HandleGetRequest', e)
  }
}
const handleSetRequest = async (socket, parsedMessage) => {
  try {
    switch (parsedMessage.request) {
      case 'trello_prefs':
          if (parsedMessage.data) {
            await setTrelloPrefs(parsedMessage.data);
            console.log("Successfully set Trello prefs");
          } else {
            await sendError(socket, 'trello_prefs request is missing data')
          }
        break;
      case 'trello_add_list_pref':
          if (parsedMessage.data) {
            await addListToPref(parsedMessage.data);
            console.log("Successfully added list to Trello prefs");
          } else {
            await sendError(socket, 'trello_add_list_pref request is missing data')
          }
        break;
      case 'trello_remove_list_pref':
        if (parsedMessage.data.id) {
          await removeListFromPref(parsedMessage.data.id);
          console.log("Successfully removed list from Trello prefs");
        } else {
          await sendError(socket, 'trello_remove_list_pref request is missing data')
        }
        break;
      default:
        await sendError(socket, 'Unknown Set Request', parsedMessage.request);

        break;
    }
  } catch (e) {
    console.error('SPOTIFY: Error in HandleSetRequest', e)
  }
}

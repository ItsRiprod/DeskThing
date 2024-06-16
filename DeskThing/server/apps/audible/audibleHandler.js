/* eslint-disable no-case-declarations */
import { authenticate, get, post, put, getLibrary } from './audibleUtil.js'
import { server, sendError } from '../../util/socketHandler.js'
import { getImageData  } from '../../util/imageUtil.js';

const AUDIBLE_EMAIL = process.env.AUDIBLE_EMAIL;
const AUDIBLE_PASSWORD = process.env.AUDIBLE_PASSWORD;
const COUNTRY_CODE = process.env.AUDIBLE_COUNTRY_CODE;

(async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for Python process to initialize
    const response = await authenticate(AUDIBLE_EMAIL, AUDIBLE_PASSWORD, COUNTRY_CODE);
    console.log("Logged in as " + response);
  })();

  async function sendImagesWithAsins(socket, library) {
    const imageDataPromises = library.map(async book => {
      const imageData = await getImageData(book.image_url);
      return { asin: book.asin, imageData };
    });
    const imageDataResults = await Promise.all(imageDataPromises);

  socket.send(JSON.stringify({ type: 'audible_library_images', data: imageDataResults }));
}

server.on('connection', async (socket) => {
    socket.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.app == 'audible') {
                console.log('AUDIBLE: Received message', parsedMessage);
                switch (parsedMessage.type) {
                    case 'get':
                        await handleGetRequest(socket, parsedMessage);
                        break;
                    case 'put':
                        await handlePutRequest(socket, parsedMessage);
                        break;
                    case 'post':
                        await handlePostRequest(socket, parsedMessage);
                        break;
                    default:
                        console.log('Unknown type', parsedMessage.type);
                        break;
                }
            }
        } catch (error) {
            console.error('Error in Audible ', error);
        }
    })
})

const handleGetRequest = async (socket, parsedMessage) => {
    try {
        switch (parsedMessage.request) {
            case 'util':
                const url = parsedMessage.url;
                const params = parsedMessage.params;
                const response = await get(url, params);
                console.log("Response from server: ", response);
                socket.send(
                    JSON.stringify({ type: 'message', data: response })
                );
                break;
            case 'library':
                const library = await getLibrary();
                socket.send(
                    JSON.stringify({ type: 'audible_library', data: library })
                );
                await sendImagesWithAsins(socket, library);
                break;
            default:
                await sendError(socket, 'Unknown Set Request', parsedMessage.request);
                break;
        }
    } catch (e) {
        throw new Error(`Error in handleGetRequest:`, e)
    }
}
const handlePutRequest = async (socket, parsedMessage) => {
    try {
        switch (parsedMessage.request) {
            case 'util':
                const url = parsedMessage.url;
                const params = parsedMessage.params;
                const response = await put(url, params);
                console.log("Response from server: ", response);
                socket.send(
                    JSON.stringify({ type: 'message', data: 'sent from audible' })
                );
                break;
            case 'audible_info':
                socket.send(
                    JSON.stringify({ type: 'message', data: 'sent from audible' })
                );
                break;
            default:
                await sendError(socket, 'Unknown Set Request', parsedMessage.request);
                break;
        }
    } catch (e) {
        throw new Error(`Error in handlePutRequest:`, e)
    }
}
const handlePostRequest = async (socket, parsedMessage) => {
    try {
        switch (parsedMessage.request) {
            case 'util':
                const url = parsedMessage.url;
                const params = parsedMessage.params;
                const response = await post(url, params);
                console.log("Response from server: ", response);
                socket.send(
                    JSON.stringify({ type: 'message', data: 'sent from audible' })
                );
                break;
            case 'audible_info':
                socket.send(
                    JSON.stringify({ type: 'message', data: 'sent from audible' })
                );
                break;
            default:
                await sendError(socket, 'Unknown Set Request', parsedMessage.request);
                break;
        }
    } catch (e) {
        throw new Error(`Error in handlePostRequest:`, e)
    }
}
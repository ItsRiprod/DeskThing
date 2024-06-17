/* eslint-disable no-case-declarations */
import { authenticate, get, post, put, getLibrary } from './audibleUtil.js'
import { appEventEmitter, sendError, sendData } from '../../util/socketHandler.js'
import { getImageData  } from '../../util/imageUtil.js';

async function sendImagesWithAsins(socket, library) {
    const imageDataPromises = library.map(async book => {
        const imageData = await getImageData(book.image_url);
        return { asin: book.asin, imageData };
    });
    const imageDataResults = await Promise.all(imageDataPromises);
    sendData(socket, 'audible_library_images', imageDataResults);
}

appEventEmitter.on('Audible', async (socket, parsedMessage) => {
    try {
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

    } catch (error) {
        console.error('Error in Audible ', error);
    }
})


const handleGetRequest = async (socket, parsedMessage) => {
    try {
        switch (parsedMessage.request) {
            case 'util':
                const url = parsedMessage.url;
                const params = parsedMessage.params;
                const response = await get(url, params);
                console.log("Response from server: ", response);
                sendData(socket, 'message', response)
                break;
            case 'library':
                const library = await getLibrary();
                sendData(socket, 'audible_library', library);
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
                sendData(socket, 'message', response);
       
                break;
            case 'audible_info':
                sendData(socket, 'message', 'audible_info sent from audible');
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
                sendData(socket, 'message', response);
                break;
            case 'audible_info':
                sendData(socket, 'message', 'Post sent from audible');
   
                break;
            default:
                await sendError(socket, 'Unknown Set Request', parsedMessage.request);
                break;
        }
    } catch (e) {
        throw new Error(`Error in handlePostRequest:`, e)
    }
}
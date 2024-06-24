/* eslint-disable no-case-declarations */
import { sendError, appEventEmitter, sendData } from '../../util/socketHandler.js'
import { getPreferenceData, setPreferenceData, addApp, removeApp, getModules } from '../../util/preferencesHandler.js'

appEventEmitter.on('util', async (socket, parsedMessage) => {
    try {
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

    } catch (e) {
        console.error('There was an error in UtilityHandler');
    }
})

const handleGetRequest = async (socket, parsedMessage) => {
    try {
        switch (parsedMessage.request) {
            case 'preferences':
                const preferences = await getPreferenceData();
                sendData(socket, 'utility_pref_data', preferences);
                break;
            case 'apps':
                const modules = await getModules();
                sendData(socket, 'utility_modules_data', modules);
                break;
            default:
                break;
        }
    } catch (e) {
        console.error('UTILITY: Error in HandleGetRequest', e)
    }
}
const handleSetRequest = async (socket, parsedMessage) => {
    try {
        switch (parsedMessage.request) {
            case 'preferences':
                if (parsedMessage.data) {
                    await setPreferenceData(parsedMessage.data);
                    console.log("Successfully set Preferences");
                } else {
                    await sendError(socket, 'set preferences request is missing data')
                }
                break;
            case 'add_app':
                if (parsedMessage.data && parsedMessage.data.app) {
                    let preferences;
                    if (parsedMessage.data.index !== undefined) {
                        preferences = await addApp(parsedMessage.data.app, parsedMessage.data.index);
                    } else {
                        preferences = await addApp(parsedMessage.data.app);
                    }
                    sendData(socket, 'utility_pref_data', preferences);
                } else {
                    await sendError(socket, 'Add app request is missing data');
                }
                break;
            case 'remove_app':
                if (parsedMessage.data && parsedMessage.data.app) {
                    const preferences = await removeApp(parsedMessage.data.app);
                    sendData(socket, 'utility_pref_data', preferences);
                } else {
                    await sendError(socket, 'Remove app request is missing data');
                }
                break;
            default:
                await sendError(socket, 'Unknown Set Request', parsedMessage.request);
                break;
        }
    } catch (e) {
        console.error('UTILITY: Error in HandleSetRequest', e)
    }
}

import { openAuthWindow, sendIpcAuthMessage } from '../..'
import { AuthScopes, IncomingData, Key, Action, ToClientType } from '../../types'
import dataListener, { MESSAGE_TYPES } from '../../utils/events'
import { ipcMain } from 'electron'

/**
 * Handles data received from an app.
 *
 * @param {string} app - The name of the app sending the data.
 * @param {string} type - The type of data or action requested.
 * @param {...any[]} args - Additional arguments related to the data or action.
 */
export async function handleDataFromApp(app: string, appData: IncomingData): Promise<void> {
  const { addKey, removeKey, addAction, removeAction } = await import('../keyMapHandler')
  const { sendMessageToClients } = await import('../websocketServer')
  const { getData, setData, addData } = await import('../dataHandler')
  const { getConfig } = await import('../configHandler')

  switch (appData.type) {
    case 'message':
      dataListener.asyncEmit(MESSAGE_TYPES.MESSAGE, appData.payload)
      break
    case 'get':
      switch (appData.request) {
        case 'data':
          sendMessageToApp(app, { type: 'data', payload: getData(app) })
          break
        case 'config':
          if (appData.payload) {
            const value = getConfig(appData.payload)
            sendMessageToApp(app, { type: 'config', payload: value })
          } else {
            sendMessageToApp(app, {
              type: 'error',
              payload: 'The type of config to retrieve was undefined!'
            })
            console.error(`SERVER: The type of config from ${app} was undefined`)
          }
          break
        case 'input':
          requestUserInput(app, appData.payload as AuthScopes)
          break
        default:
          break
      }
      break
    case 'set':
      setData(app, appData.payload)
      break
    case 'add':
      addData(app, appData.payload)
      break
    case 'open':
      openAuthWindow(appData.payload)
      break
    case 'data':
      if (app && appData.payload) {
        sendMessageToClients({
          app: appData.payload.app || app,
          type: appData.payload.type || '',
          payload: appData.payload.payload || '',
          request: appData.payload.request || ''
        })
      }
      break
    case 'toApp':
      if (appData.payload && appData.request) {
        sendMessageToApp(appData.request, appData.payload)
      } else {
        dataListener.asyncEmit(
          MESSAGE_TYPES.ERROR,
          `${app.toUpperCase()}: App data malformed`,
          appData.payload
        )
      }
      break
    case 'error':
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `${app.toUpperCase()}: ${appData.payload}`)
      break
    case 'log':
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `${app.toUpperCase()}: ${appData.payload}`)
      break
    case 'button':
      if (appData.request == 'add') {
        try {
          if (appData.payload) {
            const Key: Key = {
              id: appData.payload.id || 'unsetid',
              description: appData.payload.description || 'Default Description',
              source: app
            }
            addKey(Key)
            dataListener.asyncEmit(
              MESSAGE_TYPES.LOGGING,
              `${app.toUpperCase()}: Added Button Successfully`
            )
          }
        } catch (Error) {
          dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `${app.toUpperCase()}: ${Error}`)
        }
      } else if (appData.request == 'remove') {
        removeKey(appData.payload.id)
      } else if (appData.request == 'flair') {
        if (appData.payload) {
          updateFlair(appData.payload.id, appData.payload.flair)
        }
      }
      break
    case 'action':
      if (appData.request == 'add') {
        try {
          if (appData.payload) {
            const Action: Action = {
              name: appData.payload.name || 'Default Name',
              id: appData.payload.id || 'unsetid',
              description: appData.payload.description || 'No description provided',
              flair: appData.payload.flair || '',
              source: app
            }
            addAction(Action)
            dataListener.asyncEmit(
              MESSAGE_TYPES.LOGGING,
              `${app.toUpperCase()}: Added Action Successfully`
            )
          }
        } catch (Error) {
          dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `${app.toUpperCase()}: ${Error}`)
        }
      } else if (appData.request == 'remove') {
        removeAction(appData.payload.id)
      }
      break
    default:
      console.error(`Unknown data type from ${app}: ${appData.type}`)
      break
  }
}

/**
 * Handles a request for authentication data from an app.
 *
 * @param {string} appName - The name of the app requesting authentication data.
 * @param {string[]} scope - The scope of the authentication request (This is also what the user will be prompted with and how it will be saved in the file).
 */
export async function requestUserInput(appName: string, scope: AuthScopes): Promise<void> {
  // Send IPC message to renderer to display the form
  sendIpcAuthMessage('request-user-data', appName, scope)

  ipcMain.once(`user-data-response-${appName}`, async (_event, formData) => {
    sendMessageToApp(appName, { type: 'input', payload: formData })
  })
}

/**
 * Sends a message to an app.
 *
 * @param {string} appName - The name of the app to send the message to.
 * @param {string} type - The type of message being sent.
 * @param {...any[]} args - Additional arguments for the message.
 */
export async function sendMessageToApp(appName: string, data: IncomingData): Promise<void> {
  const { AppHandler } = await import('./appState')
  const appHandler = AppHandler.getInstance()

  try {
    const app = appHandler.get(appName)
    if (app && typeof app.func.toClient === 'function') {
      ;(app.func.toClient as ToClientType)(data)
    } else {
      dataListener.asyncEmit(
        MESSAGE_TYPES.ERROR,
        `SERVER: App ${appName} not found or does not have toClient function. (is it running?)`
      )
    }
  } catch (e) {
    console.error(
      `Error attempting to send message to app ${appName} with ${data.type} and data: `,
      data,
      e
    )
  }
}

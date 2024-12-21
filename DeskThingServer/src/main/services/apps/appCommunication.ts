console.log('[AppCom Service] Starting')
import { openAuthWindow, sendIpcAuthMessage } from '../..'
import {
  AuthScopes,
  MESSAGE_TYPES,
  IncomingData,
  Key,
  Action,
  ToClientType,
  IncomingAppDataTypes
} from '@shared/types'
import loggingStore from '../../stores/loggingStore'
import { ipcMain } from 'electron'

type HandlerFuncton = (app: string, appData: IncomingData) => void
type TypeHandler = {
  [key in IncomingAppDataTypes]: RequestHandler
}
type RequestHandler = {
  [key: string]: HandlerFuncton
}

/**
 * Handles data received from an app.
 *
 * @param {string} app - The name of the app sending the data.
 * @param {string} type - The type of data or action requested.
 * @param {...any[]} args - Additional arguments related to the data or action.
 */
export async function handleDataFromApp(app: string, appData: IncomingData): Promise<void> {
  if (appData.type in IncomingAppDataTypes) {
    handleData[appData.type || 'default'][appData.request || 'default'](app, appData)
  } else {
    loggingStore.log(
      MESSAGE_TYPES.WARNING,
      `[appComm]: Type ${appData.type} used by ${app} is depreciated and will be removed in a future version!`,
      app
    )
    await handleLegacyCommunication(app, appData)
  }
}

const handleRequestMissing: HandlerFuncton = (app, appData) => {
  loggingStore.log(
    MESSAGE_TYPES.WARNING,
    `[handleComs]: App ${app} sent unknown data type: ${appData.type} and request: ${appData.request}`,
    app
  )
}

const handleRequestSet: HandlerFuncton = async (app, appData) => {
  const { setData } = await import('@server/services/files/dataService')
  setData(app, appData.payload)
}

const handleRequestOpen: HandlerFuncton = async (_app, appData) => {
  const { openAuthWindow } = await import('@server/index')
  openAuthWindow(appData.payload)
}

const handleRequestLog: HandlerFuncton = (app, appData) => {
  if (appData.request && Object.values(MESSAGE_TYPES).includes(appData.request as MESSAGE_TYPES)) {
    loggingStore.log(appData.request as MESSAGE_TYPES, appData.payload, app)
  } else {
    loggingStore.log(
      MESSAGE_TYPES.WARNING,
      `[handleComs]: App ${app} sent unknown log type: ${appData.request}. Please use LOG_TYPES.LOG or similar.`,
      app
    )
  }
}
const handleRequestKeyAdd: HandlerFuncton = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/services/mappings/mappingStore')
  try {
    if (appData.payload) {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[handleDataFromApp] App ${app} is adding key ${appData.payload.id}`,
        app.toUpperCase()
      )
      const Key: Key = {
        id: appData.payload.id || 'unsetid',
        description: appData.payload.description || 'Default Description',
        source: app,
        version: appData.payload.version || '0.0.0',
        enabled: true,
        modes: appData.payload.modes || []
      }
      keyMapStore.addKey(Key)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `${app.toUpperCase()}: Added Button Successfully`)
    }
  } catch (Error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `${app.toUpperCase()}: ${Error}`)
  }
}
const handleRequestKeyRemove: HandlerFuncton = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/services/mappings/mappingStore')
  keyMapStore.removeKey(appData.payload.id)
  loggingStore.log(
    MESSAGE_TYPES.LOGGING,
    `[handleDataFromApp] App ${app} is removing key ${appData.payload.id}`,
    app.toUpperCase()
  )
}
const handleRequestKeyTrigger: HandlerFuncton = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/services/mappings/mappingStore')
  if (appData.payload.id && appData.payload.mode) {
    keyMapStore.triggerKey(appData.payload.id, appData.payload.mode)
  } else {
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `[handleDataFromApp] App ${app} failed to trigger key ${appData.payload.id}`,
      app.toUpperCase()
    )
  }
}
const handleRequestActionRun: HandlerFuncton = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/services/mappings/mappingStore')
  if (appData.payload.id) {
    keyMapStore.runAction(appData.payload.id)
  } else {
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `[handleDataFromApp] App ${app} failed to provide id ${appData.payload}`,
      app.toUpperCase()
    )
  }
}
const handleRequestActionUpdate: HandlerFuncton = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/services/mappings/mappingStore')
  if (appData.payload.id) {
    keyMapStore.updateIcon(appData.payload.id, appData.payload.icon)
  } else {
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `[handleDataFromApp] App ${app} failed to provide id ${appData.payload}`,
      app.toUpperCase()
    )
  }
}
const handleRequestActionRemove: HandlerFuncton = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/services/mappings/mappingStore')
  keyMapStore.removeAction(appData.payload.id)
  loggingStore.log(
    MESSAGE_TYPES.LOGGING,
    `[handleDataFromApp] App ${app} is removing action ${appData.payload.id}`,
    app.toUpperCase()
  )
}
const handleRequestActionAdd: HandlerFuncton = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/services/mappings/mappingStore')
  try {
    if (appData.payload) {
      const Action: Action = {
        name: appData.payload.name || 'Default Name',
        description: appData.payload.description || 'No description provided',
        id: appData.payload.id || 'unsetid',
        value: appData.payload.value || undefined,
        value_options: appData.payload.value_options || [],
        value_instructions: appData.payload.value_instructions || '',
        icon: appData.payload.icon || undefined,
        source: app,
        version: appData.payload.version || '0.0.0',
        version_code: appData.payload.version_code || 0,
        tag: appData.payload.tag || '',
        enabled: true
      }
      keyMapStore.addAction(Action)
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[handleDataFromApp] App ${app} is adding Action ${appData.payload.id}`,
        app.toUpperCase()
      )
    }
  } catch (Error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `${app.toUpperCase()}: ${Error}`)
  }
}
const handleGet = {
  data: (): void => {},
  config: (): void => {},
  settings: (): void => {},
  input: (): void => {}
}
const handleSet: RequestHandler = {
  default: handleRequestSet
}
const handleOpen: RequestHandler = {
  default: handleRequestOpen
}
const handleSendToClient: RequestHandler = {
  default: (): void => {}
}
const handleSendToApp: RequestHandler = {
  default: (): void => {}
}

const handleLog: RequestHandler = {
  [MESSAGE_TYPES.DEBUG]: handleRequestLog,
  [MESSAGE_TYPES.ERROR]: handleRequestLog,
  [MESSAGE_TYPES.FATAL]: handleRequestLog,
  [MESSAGE_TYPES.LOGGING]: handleRequestLog,
  [MESSAGE_TYPES.MESSAGE]: handleRequestLog,
  [MESSAGE_TYPES.WARNING]: handleRequestLog
}
const handleKey: RequestHandler = {
  add: handleRequestKeyAdd,
  remove: handleRequestKeyRemove,
  trigger: handleRequestKeyTrigger,
  default: handleRequestMissing
}
const handleAction: RequestHandler = {
  add: handleRequestActionAdd,
  remove: handleRequestActionRemove,
  update: handleRequestActionUpdate,
  run: handleRequestActionRun,
  default: handleRequestMissing
}
const handleDefault: RequestHandler = {
  default: handleRequestMissing
}

const handleData: TypeHandler = {
  get: handleGet,
  set: handleSet,
  open: handleOpen,
  send: handleSendToClient,
  toApp: handleSendToApp,
  log: handleLog,
  key: handleKey,
  action: handleAction,
  default: handleDefault
}

/**
 * @depreciated - DO not use. Use handleDataFromApp() instead!
 * @param app
 * @param appData
 */
const handleLegacyCommunication = async (app: string, appData: IncomingData): Promise<void> => {
  const keyMapStore = (await import('../mappings/mappingStore')).default
  const { sendMessageToClients, handleClientMessage } = await import('../client/clientCom')
  const { getData, setData, addData } = await import('../files/dataService')

  switch (appData.type) {
    case 'message':
      loggingStore.log(MESSAGE_TYPES.MESSAGE, appData.payload, app.toUpperCase())
      break
    case 'get':
      switch (appData.request) {
        case 'data':
          sendMessageToApp(app, { type: 'data', payload: getData(app) })
          break
        case 'config':
          sendMessageToApp(app, { type: 'config', payload: {} })
          loggingStore.log(
            MESSAGE_TYPES.ERROR,
            `[handleAppData]: ${app} tried accessing "Config" data type which is depreciated and no longer in use!`
          )
          break
        case 'settings':
          sendSettings(app)
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
    case 'add': // depreciated
      addData(app, appData.payload)
      break
    case 'open':
      openAuthWindow(appData.payload)
      break
    case 'data':
      if (app && appData.payload) {
        loggingStore.log(
          MESSAGE_TYPES.LOGGING,
          `[handleDataFromApp] App ${app} is sending data to the client with ${appData.payload ? (JSON.stringify(appData.payload).length > 1000 ? '[Large Payload]' : JSON.stringify(appData.payload)) : 'undefined'}`,
          app.toUpperCase()
        )
        if (appData.payload.app == 'client') {
          handleClientMessage(appData.payload)
        } else {
          sendMessageToClients({
            app: appData.payload.app || app,
            type: appData.payload.type || '',
            payload: appData.payload.payload || '',
            request: appData.payload.request || ''
          })
        }
      }
      break
    case 'toApp':
      if (appData.payload && appData.request) {
        sendMessageToApp(appData.request, appData.payload)
        loggingStore.log(
          MESSAGE_TYPES.LOGGING,
          `[handleDataFromApp] App ${app} is sending data to ${appData.request} with ${appData.payload ? (JSON.stringify(appData.payload).length > 1000 ? '[Large Payload]' : JSON.stringify(appData.payload)) : 'undefined'}`,
          app.toUpperCase()
        )
      } else {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `${app.toUpperCase()}: App data malformed`,
          appData.payload
        )
      }
      break
    case 'error':
      loggingStore.log(MESSAGE_TYPES.ERROR, `${appData.payload}`, app.toUpperCase())
      break
    case 'log':
      loggingStore.log(MESSAGE_TYPES.LOGGING, `${appData.payload}`, app.toUpperCase())
      break
    case 'button':
    case 'key':
      if (appData.request == 'add') {
        try {
          if (appData.payload) {
            loggingStore.log(
              MESSAGE_TYPES.LOGGING,
              `[handleDataFromApp] App ${app} is adding key ${appData.payload.id}`,
              app.toUpperCase()
            )
            const Key: Key = {
              id: appData.payload.id || 'unsetid',
              description: appData.payload.description || 'Default Description',
              source: app,
              version: appData.payload.version || '0.0.0',
              enabled: true,
              modes: appData.payload.modes || []
            }
            keyMapStore.addKey(Key)
            loggingStore.log(
              MESSAGE_TYPES.LOGGING,
              `${app.toUpperCase()}: Added Button Successfully`
            )
          }
        } catch (Error) {
          loggingStore.log(MESSAGE_TYPES.ERROR, `${app.toUpperCase()}: ${Error}`)
        }
      } else if (appData.request == 'remove') {
        keyMapStore.removeKey(appData.payload.id)
        loggingStore.log(
          MESSAGE_TYPES.LOGGING,
          `[handleDataFromApp] App ${app} is removing key ${appData.payload.id}`,
          app.toUpperCase()
        )
      }
      break
    case 'action':
      switch (appData.request) {
        case 'add':
          try {
            if (appData.payload) {
              const Action: Action = {
                name: appData.payload.name || 'Default Name',
                description: appData.payload.description || 'No description provided',
                id: appData.payload.id || 'unsetid',
                value: appData.payload.value || undefined,
                value_options: appData.payload.value_options || [],
                value_instructions: appData.payload.value_instructions || '',
                icon: appData.payload.icon || undefined,
                source: app,
                version: appData.payload.version || '0.0.0',
                version_code: appData.payload.version_code || 0,
                tag: appData.payload.tag || '',
                enabled: true
              }
              keyMapStore.addAction(Action)
              loggingStore.log(
                MESSAGE_TYPES.LOGGING,
                `[handleDataFromApp] App ${app} is adding Action ${appData.payload.id}`,
                app.toUpperCase()
              )
            }
          } catch (Error) {
            loggingStore.log(MESSAGE_TYPES.ERROR, `${app.toUpperCase()}: ${Error}`)
          }
          break
        case 'remove':
          keyMapStore.removeAction(appData.payload.id)
          break
        case 'update':
          if (appData.payload) {
            keyMapStore.updateIcon(appData.payload.id, appData.payload.icon)
            loggingStore.log(
              MESSAGE_TYPES.LOGGING,
              `[handleDataFromApp] App ${app} is updating ${appData.payload.id}'s icon ${appData.payload.icon}`,
              app.toUpperCase()
            )
          }
          break
        case 'run':
          if (appData.payload) {
            keyMapStore.runAction(appData.payload.id)
            loggingStore.log(
              MESSAGE_TYPES.LOGGING,
              `[handleDataFromApp] App ${app} is running action ${appData.payload.id}`,
              app.toUpperCase()
            )
          }
          break
        default:
          break
      }
      break
    default:
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `[handleDataFromApp] App ${app} sent an unknown object with type: ${appData.type} and request: ${appData.request}`,
        app.toUpperCase()
      )
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
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[sendMessageToApp] Sending message to ${appName} with ${data.type}`
      )
      ;(app.func.toClient as ToClientType)(data)
    } else {
      loggingStore.log(
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

/**
 * Sends the current settings to the app
 * @param appName
 */
const sendSettings = async (appName: string): Promise<void> => {
  const { default: settingsStore } = await import('@server/stores/settingsStore')
  const settings = await settingsStore.getSettings()
  sendMessageToApp(appName, { type: 'settings', payload: settings })
}

console.log('[AppCom Service] Starting')
import { openAuthWindow, sendIpcAuthMessage } from '../..'
import {
  AuthScopes,
  LOGGING_LEVELS,
  ToServerData,
  Key,
  Action,
  SEND_TYPES,
  AppSettings,
  AppDataInterface,
  ServerEvent,
  Task
} from '@DeskThing/types'
import { TaskReference } from '@shared/types'
import Logger from '@server/utils/logger'
import { ipcMain } from 'electron'
import { isValidStep, isValidTask } from '../task'
import { isValidKey } from '../mappings/utilsMaps'
import { isValidAppDataInterface } from './appUtils'

type HandlerFunction = (app: string, appData: ToServerData) => Promise<void>

type RequestHandler = Record<string, HandlerFunction>

const wrapHandlers = (handlers: Record<string, HandlerFunction>): Record<string, HandlerFunction> =>
  Object.fromEntries(Object.entries(handlers).map(([k, v]) => [k, wrapHandler(v)]))

const wrapHandler =
  (handler: HandlerFunction) =>
  async (app: string, data: ToServerData): Promise<void> => {
    try {
      Logger.info(`Handling ${data.type} from ${app}`, { domain: 'SERVER.' + app.toUpperCase() })
      await handler(app, data)
    } catch (error) {
      Logger.error(`Handler failed`, {
        error: error as Error,
        source: 'appCommunication',
        function: 'wrapHandler'
      })
    }
  }

/**
 * Handles data received from an app.
 *
 * @param {string} app - The name of the app sending the data.
 * @param {ToServerData} appData - The type of data or action requested.
 */
export async function handleDataFromApp(app: string, appData: ToServerData): Promise<void> {
  if (Object.values(SEND_TYPES).includes(appData.type)) {
    Logger.debug(
      `[handleDataFromApp] Handling data from ${app} with type "${appData.type}" and request "${appData.request}"`,
      { domain: 'SERVER.' + app.toUpperCase() }
    )
    try {
      handleData[appData.type || 'default'][appData.request || 'default'](app, appData)
    } catch (error) {
      Logger.log(
        LOGGING_LEVELS.WARN,
        `[handleDataFromApp]: Function "${appData.type}" and "${appData.request}" not found. Defaulting to legacy`,
        { domain: 'SERVER.' + app.toUpperCase() }
      )
      await handleLegacyCommunication(app, appData)
    }
  } else {
    Logger.log(
      LOGGING_LEVELS.WARN,
      `[appComm]: Type ${appData.type}${appData.request && ' and request ' + appData.request} used by ${app} is depreciated and will be removed in a future version!`,
      { domain: 'SERVER.' + app.toUpperCase() }
    )
    await handleLegacyCommunication(app, appData)
  }
}

/**
 * Logs a warning message when an app sends an unknown data type or request.
 *
 * @param {string} app - The name of the app that sent the unknown data.
 * @param {ToServerData} appData - The data received from the app.
 */
const handleRequestMissing: HandlerFunction = async (app: string, appData: ToServerData) => {
  Logger.log(
    LOGGING_LEVELS.WARN,
    `[handleComs]: App ${app} sent unknown data type: ${appData.type} and request: ${appData.request}, with payload ${appData.payload ? (JSON.stringify(appData.payload).length > 1000 ? '[Large Payload]' : JSON.stringify(appData.payload)) : 'undefined'}`,
    { domain: 'SERVER.' + app.toUpperCase() }
  )
}

const handleRequestSetSettings: HandlerFunction = async (app, appData) => {
  const { appStore } = await import('@server/stores')
  appStore.addSettings(app, appData.payload as AppSettings)
}

const handleRequestSetData: HandlerFunction = async (app, appData) => {
  const { appStore } = await import('@server/stores')
  if (typeof appData.payload === 'object' && appData.payload !== null) {
    appStore.addData(app, appData.payload as Record<string, string>)
  }
}

const handleRequestSetAppData: HandlerFunction = async (app, appData) => {
  const { appStore } = await import('@server/stores')
  try {
    isValidAppDataInterface(appData.payload)
    appStore.addAppData(app, appData.payload as AppDataInterface)
  } catch (error) {
    Logger.error(`[handleRequestSetAppData]: Error setting app data`, {
      error: error as Error,
      source: 'appCommunication',
      function: 'handleRequestSetAppData'
    })
  }
}

/**
 * Handles a request to set data for an app.
 *
 * @param {string} app - The name of the app requesting the data set.
 * @param {any} appData - The payload data to be set.
 * @returns {Promise<void>} - A Promise that resolves when the data has been set.
 */
const handleRequestSet: HandlerFunction = async (app: string, appData): Promise<void> => {
  const { appStore } = await import('@server/stores')
  if (!appData.payload) return
  const { settings = undefined, data = undefined } = appData.payload as AppDataInterface
  data && appStore.addData(app, data)
  settings && appStore.addSettings(app, settings)
}

/**
 * Handles a request to open an authentication window.
 *
 * @param {any} appData - The payload data containing information for the authentication window.
 * @returns {Promise<void>} - A Promise that resolves when the authentication window has been opened.
 */
const handleRequestOpen: HandlerFunction = async (app, appData) => {
  const { openAuthWindow } = await import('@server/index')
  if (typeof appData.payload == 'string') {
    openAuthWindow(appData.payload)
  } else {
    Logger.warn('App sent invalid payload for openAuthWindow', {
      source: 'appCommunication',
      function: 'handleRequestOpen',
      domain: app
    })
  }
}

/**
 * Handles a request to log data from an app.
 *
 * @param {string} app - The name of the app that sent the log request.
 * @param {ToServerData} appData - The data received from the app, including the log type and payload.
 * @returns {void}
 */
const handleRequestLog: HandlerFunction = async (app, appData) => {
  if (
    appData.request &&
    Object.values(LOGGING_LEVELS).includes(appData.request as LOGGING_LEVELS)
  ) {
    const message =
      typeof appData.payload === 'string'
        ? appData.payload
        : typeof appData.payload === 'object'
          ? JSON.stringify(appData.payload)
          : String(appData.payload)

    Logger.log(appData.request as LOGGING_LEVELS, message, { domain: app.toUpperCase() })
  } else {
    Logger.log(
      LOGGING_LEVELS.WARN,
      `[handleComs]: App ${app} sent unknown log type: ${appData.request}. Please use LOG_TYPES.LOG or similar.`,
      { domain: 'SERVER.' + app.toUpperCase() }
    )
  }
}
/**
 * Handles a request to add a new key to the key map store.
 *
 * @param {string} app - The name of the app requesting the key addition.
 * @param {any} appData - The payload data containing the key information to be added.
 * @returns {Promise<void>} - A Promise that resolves when the key has been added.
 */
const handleRequestKeyAdd: HandlerFunction = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/stores/mappingStore')
  try {
    if (appData.payload) {
      isValidKey(appData.payload)
      Logger.log(
        LOGGING_LEVELS.LOG,
        `[handleDataFromApp] App ${app} is adding key ${appData.payload.id}`,
        { domain: 'SERVER.' + app.toUpperCase() }
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
      Logger.info(`${app.toUpperCase()}: Added Button Successfully`)
    }
  } catch (Error) {
    Logger.error('Unable to add key', {
      domain: 'SERVER.' + app.toUpperCase(),
      error: Error as Error,
      function: 'handleRequestKeyAdd',
      source: 'appCommunication'
    })
  }
}
/**
 * Handles a request to remove a key from the key map store.
 *
 * @param {string} app - The name of the app requesting the key removal.
 * @param {any} appData - The payload data containing the ID of the key to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the key has been removed.
 */
const handleRequestKeyRemove: HandlerFunction = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/stores/mappingStore')
  if (!appData.payload || typeof appData.payload !== 'object') {
    Logger.error('Invalid payload for key removal', {
      domain: 'SERVER.' + app.toUpperCase(),
      function: 'handleRequestKeyRemove',
      source: 'appCommunication'
    })
    return
  }
  const payload = appData.payload as Record<string, unknown>
  if (typeof payload.id == 'string') {
    keyMapStore.removeKey(payload.id)
    Logger.log(LOGGING_LEVELS.LOG, `[handleDataFromApp] App ${app} is removing key ${payload.id}`, {
      domain: 'SERVER.' + app.toUpperCase()
    })
  } else {
    Logger.error('No ID found in payload (unable to add it)', {
      domain: 'SERVER.' + app.toUpperCase(),
      function: 'handleRequestKeyRemove',
      source: 'appCommunication'
    })
  }
}
/**
 * Handles a request to trigger a key in the key map store.
 *
 * @param {string} app - The name of the app requesting the key trigger.
 * @param {any} appData - The payload data containing the ID and mode of the key to be triggered.
 * @returns {Promise<void>} - A Promise that resolves when the key has been triggered.
 */
const handleRequestKeyTrigger: HandlerFunction = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/stores/mappingStore')
  if (appData.payload.id && appData.payload.mode) {
    keyMapStore.triggerKey(appData.payload.id, appData.payload.mode)
  } else {
    Logger.log(
      LOGGING_LEVELS.LOG,
      `[handleDataFromApp] App ${app} failed to trigger key ${appData.payload.id}`,
      { domain: 'SERVER.' + app.toUpperCase() }
    )
  }
}
/**
 * Handles a request to run an action in the key map store.
 *
 * @param {string} app - The name of the app requesting the action run.
 * @param {any} appData - The payload data containing the ID of the action to be run.
 * @returns {Promise<void>} - A Promise that resolves when the action has been run.
 */
const handleRequestActionRun: HandlerFunction = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/stores/mappingStore')
  if (appData.payload.id) {
    keyMapStore.runAction(appData.payload.id)
  } else {
    Logger.log(
      LOGGING_LEVELS.LOG,
      `[handleDataFromApp] App ${app} failed to provide id ${appData.payload}`,
      { domain: 'SERVER.' + app.toUpperCase() }
    )
  }
}
/**
 * Handles a request to update the icon of an action in the key map store.
 *
 * @param {string} app - The name of the app requesting the action icon update.
 * @param {any} appData - The payload data containing the ID of the action and the new icon.
 * @returns {Promise<void>} - A Promise that resolves when the action icon has been updated.
 */
const handleRequestActionUpdate: HandlerFunction = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/stores/mappingStore')
  if (appData.payload.id) {
    keyMapStore.updateIcon(appData.payload.id, appData.payload.icon)
  } else {
    Logger.log(
      LOGGING_LEVELS.LOG,
      `[handleDataFromApp] App ${app} failed to provide id ${appData.payload}`,
      { domain: 'SERVER.' + app.toUpperCase() }
    )
  }
}
/**
 * Handles a request to remove an action from the key map store.
 *
 * @param {string} app - The name of the app requesting the action removal.
 * @param {any} appData - The payload data containing the ID of the action to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the action has been removed.
 */
const handleRequestActionRemove: HandlerFunction = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/stores/mappingStore')
  keyMapStore.removeAction(appData.payload.id)
  Logger.log(
    LOGGING_LEVELS.LOG,
    `[handleDataFromApp] App ${app} is removing action ${appData.payload.id}`,
    { domain: 'SERVER.' + app.toUpperCase() }
  )
}
/**
 * Handles a request to add a new action to the key map store.
 *
 * @param {string} app - The name of the app requesting the action addition.
 * @param {any} appData - The payload data containing the details of the action to be added.
 * @returns {Promise<void>} - A Promise that resolves when the action has been added.
 */
const handleRequestActionAdd: HandlerFunction = async (app, appData): Promise<void> => {
  const { default: keyMapStore } = await import('@server/stores/mappingStore')
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
      Logger.log(
        LOGGING_LEVELS.LOG,
        `[handleDataFromApp] App ${app} is adding Action ${appData.payload.id}`,
        { domain: 'SERVER.' + app.toUpperCase() }
      )
    }
  } catch (Error) {
    Logger.log(LOGGING_LEVELS.ERROR, `${app.toUpperCase()}: ${Error}`)
  }
}

/**
 * Handles a request to retrieve data for a specific app.
 *
 * @param {string} app - The name of the app requesting the data.
 * @returns {Promise<void>} - A Promise that resolves when the data has been sent to the app.
 */
const handleRequestGetData: HandlerFunction = async (app): Promise<void> => {
  const { appStore } = await import('@server/stores')

  const data = await appStore.getData(app)
  if (data) {
    appStore.sendDataToApp(app, { type: ServerEvent.DATA, payload: data })
  } else {
    Logger.error(`[handleData]: App ${app} failed to provide data`, {
      domain: 'SERVER.' + app.toUpperCase()
    })
  }
}

/**
 * Handles a request to retrieve data for a specific app.
 *
 * @param {string} app - The name of the app requesting the data.
 * @returns {Promise<void>} - A Promise that resolves when the data has been sent to the app.
 */
const handleRequestGetAppData: HandlerFunction = async (app): Promise<void> => {
  const { appStore } = await import('@server/stores')

  const data = await appStore.getAppData(app)
  if (data) {
    appStore.sendDataToApp(app, { type: ServerEvent.APPDATA, payload: data })
  } else {
    Logger.error(`[handleAppData]: App ${app} failed to provide data`, {
      domain: 'SERVER.' + app.toUpperCase()
    })
  }
}

/**
 * Handles a request to delete data for a specific app.
 *
 * @param {string} app - The name of the app requesting the settings.
 * @returns {Promise<void>} - A Promise that resolves when the settings have been sent to the app.
 */
const handleRequestDelData: HandlerFunction = async (app, appData): Promise<void> => {
  Logger.log(
    LOGGING_LEVELS.LOG,
    `[handleAppData]: ${app} is deleting data: ${appData.payload.toString()}`
  )
  if (
    !appData.payload ||
    (typeof appData.payload !== 'string' && !Array.isArray(appData.payload))
  ) {
    Logger.log(
      LOGGING_LEVELS.ERROR,
      `[handleAppData]: Cannot delete data because ${appData.payload.toString()} is not a string or string[]`
    )
    return
  }

  const { appStore } = await import('@server/stores')
  await appStore.delData(app, appData.payload)
}

const handleRequestGetConfig: HandlerFunction = async (app): Promise<void> => {
  const { appStore } = await import('@server/stores')
  appStore.sendDataToApp(app, { type: ServerEvent.CONFIG, payload: {} })
  Logger.log(
    LOGGING_LEVELS.ERROR,
    `[handleAppData]: ${app} tried accessing "Config" data type which is depreciated and no longer in use!`
  )
}

/**
 * Handles a request to retrieve the settings for a specific app.
 *
 * @param {string} app - The name of the app requesting the settings.
 * @returns {Promise<void>} - A Promise that resolves when the settings have been sent to the app.
 */
const handleRequestGetSettings: HandlerFunction = async (app): Promise<void> => {
  const { appStore } = await import('@server/stores')
  const settings = await appStore.getSettings(app)
  if (settings) {
    appStore.sendDataToApp(app, { type: ServerEvent.SETTINGS, payload: settings })
  } else {
    Logger.error(`[handleAppData]: App ${app} failed to provide settings`, {
      domain: 'SERVER.' + app.toUpperCase()
    })
  }
}

/**
 * Handles a request to delete settings for a specific app.
 *
 * @param {string} app - The name of the app requesting the settings.
 * @returns {Promise<void>} - A Promise that resolves when the settings have been sent to the app.
 */
const handleRequestDelSettings: HandlerFunction = async (app, appData): Promise<void> => {
  Logger.log(
    LOGGING_LEVELS.LOG,
    `[handleAppData]: ${app} is deleting settings: ${appData.payload.toString()}`
  )
  if (
    !appData.payload ||
    (typeof appData.payload !== 'string' && !Array.isArray(appData.payload))
  ) {
    Logger.log(
      LOGGING_LEVELS.ERROR,
      `[handleAppData]: Cannot delete settings because ${appData.payload.toString()} is not a string or string[]`
    )
    return
  }

  const { appStore } = await import('@server/stores')
  await appStore.delSettings(app, appData.payload)
}

/**
 * Handles a request to retrieve input data for a specific app.
 *
 * This function sends an IPC message to the renderer process to display a form and request user data. Once the user data is received, it is sent back to the app via a message.
 *
 * @param {string} app - The name of the app requesting the input data.
 * @param {object} appData - Additional data associated with the request.
 * @returns {Promise<void>} - A Promise that resolves when the input data has been sent to the app.
 */
const handleRequestGetInput: HandlerFunction = async (app, appData) => {
  // Send IPC message to renderer to display the form
  sendIpcAuthMessage('request-user-data', app, appData.payload)

  ipcMain.once(`user-data-response-${app}`, async (_event, formData) => {
    const { appStore } = await import('@server/stores')
    appStore.sendDataToApp(app, { type: ServerEvent.INPUT, request: '', payload: formData })
  })
}

const handleRequestSendToClient = async (app, appData): Promise<void> => {
  const { sendMessageToClients, handleClientMessage } = await import('../client/clientCom')
  if (app && appData.payload) {
    Logger.log(
      LOGGING_LEVELS.LOG,
      `[handleDataFromApp] App ${app} is sending data to the client with ${appData.payload ? (JSON.stringify(appData.payload).length > 1000 ? '[Large Payload]' : JSON.stringify(appData.payload)) : 'undefined'}`,
      { domain: 'SERVER.' + app.toUpperCase() }
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
}

const handleRequestSendToApp: HandlerFunction = async (app, appData): Promise<void> => {
  if (appData.payload && appData.request) {
    const { appStore } = await import('@server/stores')
    appStore.sendDataToApp(appData.request, appData.payload)
    Logger.log(
      LOGGING_LEVELS.LOG,
      `[handleDataFromApp] App ${app} is sending data to ${appData.request} with ${appData.payload ? (JSON.stringify(appData.payload).length > 1000 ? '[Large Payload]' : JSON.stringify(appData.payload)) : 'undefined'}`,
      { domain: 'SERVER.' + app.toUpperCase() }
    )
  } else {
    Logger.log(LOGGING_LEVELS.ERROR, `${app.toUpperCase()}: App data malformed`, appData.payload)
  }
}

const taskWrapper = (handler: HandlerFunction) => {
  return async (app: string, appData: ToServerData): Promise<void> => {
    try {
      if (!appData.payload.taskId) {
        Logger.info('Missing taskId', {
          domain: 'SERVER.' + app.toUpperCase(),
          function: 'taskWrapper'
        })
        return
      }
      await handler(app, appData)
    } catch (error) {
      Logger.log(LOGGING_LEVELS.ERROR, `[handleAppData]: ${error}`)
    }
  }
}

// Tasks
const handleRequestInitTasks: HandlerFunction = async (app, appData): Promise<void> => {
  const { appStore } = await import('@server/stores')
  const existingTasks = (await appStore.getTasks(app)) || {}

  try {
    const newTasks = Object.entries(appData.payload.tasks as Record<string, Task>).reduce<
      Record<string, Task>
    >((acc, [id, task]) => {
      try {
        isValidTask(task)
        if (!existingTasks[id]) {
          acc[id] = task
        }
        return acc
      } catch (error) {
        Logger.error(
          `Error in handleRequestInitTasks. Unable to add task ${typeof task == 'object' ? JSON.stringify(task) : 'unknown'}`,
          {
            domain: 'SERVER.' + app.toUpperCase(),
            function: 'handleRequestInitTasks',
            error: error as Error
          }
        )
        return acc
      }
    }, {})

    const mergedTasks = { ...existingTasks, ...newTasks }

    const { sendMessageToClients } = await import('../client/clientCom')
    sendMessageToClients({
      app: app,
      type: ServerEvent.TASKS,
      payload: mergedTasks,
      request: 'update'
    })
    appStore.setTasks(app, mergedTasks)
  } catch (error) {
    Logger.error('Error in handleRequestInitTasks', {
      domain: 'SERVER.' + app.toUpperCase(),
      function: 'handleRequestInitTasks',
      error: error as Error
    })
  }
}

const handleRequestGetTask: HandlerFunction = async (app): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  const tasks = taskStore.getTasksBySource(app)
  if (tasks) {
    const { sendMessageToClients } = await import('../client/clientCom')
    Logger.fatal('FIX THIS: App return type for "get step" has not been finalized yet!', {
      function: 'handleRequestGetStep',
      source: 'appCommunication.ts'
    })
    const task: Record<string, Task | TaskReference> = Object.fromEntries(
      tasks.map((task) => [task.id, task])
    )
    sendMessageToClients({
      app: app,
      type: 'task',
      payload: task,
      request: 'update'
    })
  }
}
const handleRequestUpdateTask: HandlerFunction = async (app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  if (!appData.payload.task || appData.payload.task.id) {
    Logger.warn('Missing step or step id', {
      domain: 'SERVER.' + app.toUpperCase(),
      function: 'handleRequestUpdateStep'
    })
    return
  }
  return taskStore.updateTask(appData.payload.task)
}
const handleRequestDeleteTask: HandlerFunction = async (_app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  return taskStore.deleteTask(appData.payload.taskId)
}
const handleRequestAddTask: HandlerFunction = async (app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  try {
    isValidTask(appData.payload.task)
    return taskStore.addTask(appData.payload.task)
  } catch (error) {
    Logger.error(`Invalid task`, {
      domain: 'SERVER.' + app.toUpperCase(),
      function: 'handleRequestAddTask',
      error: error as Error
    })
  }
}
const handleRequestCompleteTask: HandlerFunction = async (_app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  return taskStore.completeTask(appData.payload.taskId)
}
const handleRequestRestartTask: HandlerFunction = async (_app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  return taskStore.restartTask(appData.payload.taskId)
}
const handleRequestStartTask: HandlerFunction = async (_app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  return taskStore.startTask(appData.payload.taskId)
}
const handleRequestEndTask: HandlerFunction = async (_app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  return taskStore.stopTask(appData.payload.taskId)
}

const stepWrapper = (handler: HandlerFunction) => {
  return async (app: string, appData: ToServerData): Promise<void> => {
    try {
      if (!appData.payload.taskId || !appData.payload.stepId) {
        Logger.info('Missing taskId or stepId', {
          domain: 'SERVER.' + app.toUpperCase(),
          function: 'stepWrapper'
        })
        return
      }
      await handler(app, appData)
    } catch (error) {
      Logger.log(LOGGING_LEVELS.ERROR, `[handleAppData]: ${error}`)
    }
  }
}

// Steps
const handleRequestGetStep: HandlerFunction = async (app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  const step = await taskStore.getStep(appData.payload.taskId, appData.payload.stepId)
  if (step) {
    const { sendMessageToClients } = await import('../client/clientCom')
    Logger.fatal('FIX THIS: App return type for "get step" has not been finalized yet!', {
      function: 'handleRequestGetStep',
      source: 'appCommunication.ts'
    })
    sendMessageToClients({
      app: app,
      type: 'task',
      payload: step,
      request: 'step'
    })
  }
}
const handleRequestUpdateStep: HandlerFunction = async (app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  if (!appData.payload.step || appData.payload.step.id) {
    Logger.warn('Missing step or step id', {
      domain: 'SERVER.' + app.toUpperCase(),
      function: 'handleRequestAddStep'
    })
    return
  }
  return taskStore.updateStep(appData.payload.taskId, appData.payload.step)
}
const handleRequestDeleteStep: HandlerFunction = async (_app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  return taskStore.deleteStep(appData.payload.taskId, appData.payload.stepId)
}
const handleRequestAddStep: HandlerFunction = async (app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  if (!appData.payload.step) {
    Logger.warn('Missing step', {
      domain: 'SERVER.' + app.toUpperCase(),
      function: 'handleRequestAddStep'
    })
    return
  }
  try {
    isValidStep(appData.payload.step)
    taskStore.addStep(appData.payload.taskId, appData.payload.step)
  } catch (error) {
    Logger.warn(`Unable to verify step: ${error}`, {
      domain: 'SERVER.' + app.toUpperCase(),
      function: 'handleRequestAddStep'
    })
  }
}
const handleRequestCompleteStep: HandlerFunction = async (_app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  return taskStore.completeStep(appData.payload.taskId, appData.payload.stepId)
}
const handleRequestRestartStep: HandlerFunction = async (_app, appData): Promise<void> => {
  const { taskStore } = await import('@server/stores')
  return taskStore.restartStep(appData.payload.taskId, appData.payload.stepId)
}

const handleTask: RequestHandler = {
  init: handleRequestInitTasks,
  get: handleRequestGetTask,
  update: taskWrapper(handleRequestUpdateTask),
  delete: taskWrapper(handleRequestDeleteTask),
  add: handleRequestAddTask,
  complete: taskWrapper(handleRequestCompleteTask),
  restart: taskWrapper(handleRequestRestartTask),
  start: taskWrapper(handleRequestStartTask),
  end: taskWrapper(handleRequestEndTask),
  default: taskWrapper(handleRequestMissing)
}
const handleStep: RequestHandler = {
  get: stepWrapper(handleRequestGetStep),
  update: stepWrapper(handleRequestUpdateStep),
  delete: stepWrapper(handleRequestDeleteStep),
  add: taskWrapper(handleRequestAddStep),
  complete: stepWrapper(handleRequestCompleteStep),
  restart: stepWrapper(handleRequestRestartStep),
  default: stepWrapper(handleRequestMissing)
}
const handleGet = {
  data: handleRequestGetData,
  appData: handleRequestGetAppData,
  config: handleRequestGetConfig,
  settings: handleRequestGetSettings,
  input: handleRequestGetInput
}
const handleSet: RequestHandler = {
  settings: handleRequestSetSettings,
  data: handleRequestSetData,
  appData: handleRequestSetAppData,
  default: handleRequestSet
}
const handleDelete: RequestHandler = {
  settings: handleRequestDelSettings,
  data: handleRequestDelData
}

const handleOpen: RequestHandler = {
  default: handleRequestOpen
}
const handleSendToClient: RequestHandler = {
  default: handleRequestSendToClient
}
const handleSendToApp: RequestHandler = {
  default: handleRequestSendToApp
}
const handleLog: RequestHandler = {
  [LOGGING_LEVELS.DEBUG]: handleRequestLog,
  [LOGGING_LEVELS.ERROR]: handleRequestLog,
  [LOGGING_LEVELS.FATAL]: handleRequestLog,
  [LOGGING_LEVELS.LOG]: handleRequestLog,
  [LOGGING_LEVELS.MESSAGE]: handleRequestLog,
  [LOGGING_LEVELS.WARN]: handleRequestLog,
  default: handleRequestMissing
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

const handleData: Record<SEND_TYPES, RequestHandler> = {
  get: wrapHandlers(handleGet),
  set: wrapHandlers(handleSet),
  delete: wrapHandlers(handleDelete),
  open: wrapHandlers(handleOpen),
  send: wrapHandlers(handleSendToClient),
  toApp: wrapHandlers(handleSendToApp),
  log: wrapHandlers(handleLog),
  key: wrapHandlers(handleKey),
  action: wrapHandlers(handleAction),
  default: wrapHandlers(handleDefault),
  task: wrapHandlers(handleTask),
  step: wrapHandlers(handleStep)
}

/**
 * ---------------------------------------------------------------------------
 * Legacy Communication
 * None of the following functions should be used
 */

/**
 * @depreciated - DO not use. Use handleDataFromApp() instead!
 * @param app
 * @param appData
 */
const handleLegacyCommunication = async (app: string, appData: ToServerData): Promise<void> => {
  const keyMapStore = (await import('@server/stores/mappingStore')).default
  const { sendMessageToClients, handleClientMessage } = await import('../client/clientCom')
  const { appStore } = await import('@server/stores')

  switch (appData.type as string) {
    case 'message':
      Logger.log(LOGGING_LEVELS.MESSAGE, appData.payload, { domain: 'SERVER.' + app.toUpperCase() })
      break
    case 'get':
      switch (appData.request) {
        case 'data':
          {
            appStore.sendDataToApp(app, {
              type: ServerEvent.DATA,
              payload: (await appStore.getData(app)) as Record<string, string>
            })
          }
          break
        case 'config':
          {
            appStore.sendDataToApp(app, { type: ServerEvent.CONFIG, payload: {} })
            Logger.log(
              LOGGING_LEVELS.ERROR,
              `[handleAppData]: ${app} tried accessing "Config" data type which is depreciated and no longer in use!`
            )
          }
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
      handleRequestSet(app, appData)
      break
    case 'add': // depreciated
      handleRequestSet(app, appData)
      break
    case 'open':
      openAuthWindow(appData.payload)
      break
    case 'data':
      if (app && appData.payload) {
        Logger.log(
          LOGGING_LEVELS.LOG,
          `[handleDataFromApp] App ${app} is sending data to the client with ${appData.payload ? (JSON.stringify(appData.payload).length > 1000 ? '[Large Payload]' : JSON.stringify(appData.payload)) : 'undefined'}`,
          { domain: 'SERVER.' + app.toUpperCase() }
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
        appStore.sendDataToApp(appData.request, appData.payload)
        Logger.log(
          LOGGING_LEVELS.LOG,
          `[handleDataFromApp] App ${app} is sending data to ${appData.request} with ${appData.payload ? (JSON.stringify(appData.payload).length > 1000 ? '[Large Payload]' : JSON.stringify(appData.payload)) : 'undefined'}`,
          { domain: 'SERVER.' + app.toUpperCase() }
        )
      } else {
        Logger.log(
          LOGGING_LEVELS.ERROR,
          `${app.toUpperCase()}: App data malformed`,
          appData.payload
        )
      }
      break
    case 'error':
      Logger.log(LOGGING_LEVELS.ERROR, `${appData.payload}`, {
        domain: 'SERVER.' + app.toUpperCase()
      })
      break
    case 'log':
      Logger.info(`${appData.payload}`, { domain: 'SERVER.' + app.toUpperCase() })
      break
    case 'button':
    case 'key':
      if (appData.request == 'add') {
        try {
          if (appData.payload) {
            Logger.log(
              LOGGING_LEVELS.LOG,
              `[handleDataFromApp] App ${app} is adding key ${appData.payload.id}`,
              { domain: 'SERVER.' + app.toUpperCase() }
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
            Logger.info(`${app.toUpperCase()}: Added Button Successfully`)
          }
        } catch (Error) {
          Logger.log(LOGGING_LEVELS.ERROR, `${app.toUpperCase()}: ${Error}`)
        }
      } else if (appData.request == 'remove') {
        keyMapStore.removeKey(appData.payload.id)
        Logger.log(
          LOGGING_LEVELS.LOG,
          `[handleDataFromApp] App ${app} is removing key ${appData.payload.id}`,
          { domain: 'SERVER.' + app.toUpperCase() }
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
              Logger.log(
                LOGGING_LEVELS.LOG,
                `[handleDataFromApp] App ${app} is adding Action ${appData.payload.id}`,
                { domain: 'SERVER.' + app.toUpperCase() }
              )
            }
          } catch (Error) {
            Logger.log(LOGGING_LEVELS.ERROR, `${app.toUpperCase()}: ${Error}`)
          }
          break
        case 'remove':
          keyMapStore.removeAction(appData.payload.id)
          break
        case 'update':
          if (appData.payload) {
            keyMapStore.updateIcon(appData.payload.id, appData.payload.icon)
            Logger.log(
              LOGGING_LEVELS.LOG,
              `[handleDataFromApp] App ${app} is updating ${appData.payload.id}'s icon ${appData.payload.icon}`,
              { domain: 'SERVER.' + app.toUpperCase() }
            )
          }
          break
        case 'run':
          if (appData.payload) {
            keyMapStore.runAction(appData.payload.id)
            Logger.log(
              LOGGING_LEVELS.LOG,
              `[handleDataFromApp] App ${app} is running action ${appData.payload.id}`,
              { domain: 'SERVER.' + app.toUpperCase() }
            )
          }
          break
        default:
          break
      }
      break
    default:
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[handleDataFromApp] App ${app} sent an unknown object with type: ${appData.type} and request: ${appData.request}`,
        { domain: 'SERVER.' + app.toUpperCase() }
      )
      break
  }
}

/**
 * Handles a request for authentication data from an app.
 *
 * @deprecated - This function is deprecated and will be removed in a future version.
 * @param {string} appName - The name of the app requesting authentication data.
 * @param {string[]} scope - The scope of the authentication request (This is also what the user will be prompted with and how it will be saved in the file).
 */
export async function requestUserInput(appName: string, scope: AuthScopes): Promise<void> {
  // Send IPC message to renderer to display the form
  sendIpcAuthMessage('request-user-data', appName, scope)

  ipcMain.once(`user-data-response-${appName}`, async (_event, formData) => {
    const { appStore } = await import('@server/stores')
    appStore.sendDataToApp(appName, { type: ServerEvent.INPUT, request: '', payload: formData })
  })
}

/**
 * Sends the current settings to the app
 * @param appName
 */
const sendSettings = async (appName: string): Promise<void> => {
  const { default: settingsStore } = await import('@server/stores/settingsStore')
  const settings = await settingsStore.getSettings()
  const { appStore } = await import('@server/stores')
  appStore.sendDataToApp(appName, { type: ServerEvent.SETTINGS, payload: settings })
}

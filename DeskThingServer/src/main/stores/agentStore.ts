import { AppStoreClass } from '@shared/stores/appStore'
import {
  AgentMessage,
  APP_REQUESTS,
  Client,
  DESKTHING_DEVICE,
  DESKTHING_EVENTS,
  DEVICE_DESKTHING,
  DeviceToDeskthingData
} from '@deskthing/types'
import logger from '@server/utils/logger'
import { PlatformStoreClass, PlatformStoreEvent } from '@shared/stores/platformStore'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { AppProcessListener } from '@shared/stores/appProcessStore'
import { AgentStoreClass } from '@shared/stores/agentStore'
import { bufferToTransferable, copyBuffer } from '@server/utils/bufferUtils'

/** AgentStore implementation */
export class AgentStore implements AgentStoreClass {
  readonly autoInit: boolean = true
  initialized: boolean = false
  private agentApps: string[] = []
  private appStore: AppStoreClass
  private platformStore: PlatformStoreClass
  private settingsStore: SettingsStoreClass

  constructor(
    appStore: AppStoreClass,
    platformStore: PlatformStoreClass,
    settingsStore: SettingsStoreClass
  ) {
    this.appStore = appStore
    this.platformStore = platformStore
    this.settingsStore = settingsStore
  }

  // Nothing to cache or save
  clearCache: () => Promise<void> = async () => {
    return Promise.resolve()
  }
  saveToFile: () => Promise<void> = async () => {
    return Promise.resolve()
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    // Mark as initialized to prevent re-initialization
    this.initialized = true

    // init apps that are agents
    this.agentApps = (await this.settingsStore.getSetting('voice_agent_app_ids')) || []

    this.setupListeners()
  }

  setupListeners(): void {
    this.appStore.onAppMessage(APP_REQUESTS.AGENT, this.handleAppMessage)

    this.settingsStore.on('voice_agent_app_ids', (newAgentApps) => {
      this.agentApps = newAgentApps || []
    })

    this.platformStore.on(PlatformStoreEvent.BINARY_RECEIVED, this.handleBinaryMessage)
    this.platformStore.on(PlatformStoreEvent.DATA_RECEIVED, this.handleDataMessage)
  }

  private handleDataMessage = async ({
    client,
    data
  }: {
    client: Client
    data: DeviceToDeskthingData
  }): Promise<void> => {
    if (data.app != 'server') return
    if (data.type !== DEVICE_DESKTHING.AUDIO) return
    // Handle the data message

    const { warn, debug } = logger.createLogger({
      method: 'binaryReceived',
      store: 'platformStore'
    })
    if (!this.agentApps || this.agentApps.length === 0) {
      warn(`No voice agent apps configured`)
      return
    }

    const apps = this.appStore.getOrder()
    const availableAgentApps = this.agentApps.filter((appId) => apps.includes(appId))

    switch (data.request) {
      case 'end':
        debug(`Audio session ended, notifying apps`)
        for (const appId of availableAgentApps) {
          // forward it to the app
          this.appStore.sendDataToApp(appId, {
            type: DESKTHING_EVENTS.AGENT,
            request: 'end',
            payload: 'Audio session ended',
            clientId: client.clientId
          })
        }
        // forward to the app
        break
      case 'start':
        debug(`Audio session started, notifying apps`)
        for (const appId of availableAgentApps) {
          // forward it to the app
          this.appStore.sendDataToApp(appId, {
            type: DESKTHING_EVENTS.AGENT,
            request: 'start',
            payload: 'Audio session started',
            clientId: client.clientId
          })
        }
        break
      case 'clear': // clears the channel
        debug(`Audio session ${client.clientId} cleared, notifying apps`)
        for (const appId of availableAgentApps) {
          // forward it to the app
          this.appStore.sendDataToApp(appId, {
            type: DESKTHING_EVENTS.AGENT,
            request: 'clear',
            payload: 'none given',
            clientId: client.clientId
          })
        }
        break
      case 'fetch': // fetches the conversation history
        debug(`Audio session ${client.clientId} fetching history, notifying apps`)
        for (const appId of availableAgentApps) {
          // forward it to the app
          this.appStore.sendDataToApp(appId, {
            type: DESKTHING_EVENTS.AGENT,
            request: 'fetch',
            payload: 'none given',
            clientId: client.clientId
          })
        }
        break
      case 'delete': // deletes a specific message
        for (const appId of availableAgentApps) {
          // forward it to the app
          this.appStore.sendDataToApp(appId, {
            type: DESKTHING_EVENTS.AGENT,
            request: 'delete',
            payload: data.payload,
            clientId: client.clientId
          })
        }
        break
      default:
    }
  }

  private handleBinaryMessage = async ({
    client,
    data
  }: {
    client: Client
    data: Buffer
  }): Promise<void> => {
    const { warn } = logger.createLogger({
      method: 'binaryReceived',
      store: 'platformStore'
    })

    if (!this.agentApps || this.agentApps.length === 0) {
      warn(`No voice agent apps configured`)
      return
    }

    const apps = this.appStore.getOrder()
    const agentAppsInSystem = this.agentApps.filter((appId) => apps.includes(appId))

    if (agentAppsInSystem.length === 1) {
      const appId = agentAppsInSystem[0]
      // transfer the buffer - it is only needed once
      const transferBuffer = bufferToTransferable(data)

      this.appStore.sendBinaryToApp(
        appId,
        {
          type: DESKTHING_EVENTS.AGENT,
          request: 'binary',
          payload: transferBuffer,
          clientId: client.clientId
        },
        [transferBuffer as ArrayBuffer]
      )
    } else {
      for (const appId of agentAppsInSystem) {
        // forward it to the app

        // copy the buffer per-app so each gets something they can use
        const buffCopy = copyBuffer(data)

        const transferBuffer = bufferToTransferable(buffCopy)

        this.appStore.sendBinaryToApp(
          appId,
          {
            type: DESKTHING_EVENTS.AGENT,
            request: 'binary',
            payload: transferBuffer,
            clientId: client.clientId
          },
          [transferBuffer as ArrayBuffer]
        )
      }
    }
  }

  /**
   * Checks if the appId can be sending agent requests at all
   * @param appId
   */
  private isAuthed = (appId: string): boolean => {
    return this.agentApps.includes(appId)
  }

  private handleAppMessage: AppProcessListener<APP_REQUESTS.AGENT> = (response) => {
    if (!this.isAuthed(response.source)) {
      logger.warn(
        `Unauthorized agent request from app ${response.source}! Blocking. Add it as an Agent for it to work in settings.`,
        {
          method: 'handleAppMessage',
          store: 'agentStore'
        }
      )
      return
    }

    if (!response || !response.payload) {
      logger.warn(`Malformed agent request from app ${response.source}! Blocking.`, {
        method: 'handleAppMessage',
        store: 'agentStore'
      })
      return
    }

    switch (response.request) {
      case 'disconnect':
        // disconnect the app
        this.handleDisconnect(response.payload)
        break
      case 'response':
        // handle response
        this.handleAppResponse(response.payload)
        break
      case 'context':
        // handle response
        this.handleAgentContext(response.payload)
        break
      case 'token':
        // handle response
        this.handleAgentToken(response.payload)
        break
    }
  }

  private handleDisconnect = async (clientId: string): Promise<void> => {
    // send a message to the client to turn off the mic
    const result = await this.platformStore.sendDataToClient({
      type: DESKTHING_DEVICE.AGENT,
      request: 'disconnect',
      payload: 'You have been disconnected',
      clientId: clientId,
      app: 'client'
    })

    if (!result) {
      logger.warn(`Failed to send agent response to client ${clientId}`, {
        method: 'handleDisconnect',
        store: 'agentStore'
      })
    }
  }

  private handleAppResponse = async (
    message: AgentMessage & { clientId: string }
  ): Promise<void> => {
    // handle the response from the app

    const result = await this.platformStore.sendDataToClient({
      type: DESKTHING_DEVICE.AGENT,
      request: 'response',
      payload: message,
      clientId: message.clientId,
      app: 'client'
    })

    if (!result) {
      logger.warn(`Failed to send agent response to client ${message.clientId}`, {
        method: 'handleAppResponse',
        store: 'agentStore'
      })
    }
  }

  private handleAgentContext = async (
    message: (AgentMessage & { clientId: string })[]
  ): Promise<void> => {
    // handle the response from the app

    const clientId = message.length > 0 ? message[0].clientId : null

    if (!clientId) {
      logger.warn(`No clientId provided in context message`, {
        method: 'handleAppContext',
        store: 'agentStore'
      })
      return
    }

    const result = await this.platformStore.sendDataToClient({
      type: DESKTHING_DEVICE.AGENT,
      request: 'context',
      payload: message,
      clientId: clientId,
      app: 'client'
    })

    if (!result) {
      logger.warn(`Failed to send agent response to client ${clientId}`, {
        method: 'handleAppResponse',
        store: 'agentStore'
      })
    }
  }

  private handleAgentToken = async (message: {
    messageId: string
    token: string
    clientId: string
  }): Promise<void> => {
    // handle the response from the app

    const clientId = message.clientId

    if (!clientId) {
      logger.warn(`No clientId provided in token message`, {
        method: 'handleAgentToken',
        store: 'agentStore'
      })
      return
    }

    const result = await this.platformStore.sendDataToClient({
      type: DESKTHING_DEVICE.AGENT,
      request: 'token',
      payload: message,
      clientId: clientId,
      app: 'client'
    })

    if (!result) {
      logger.warn(`Failed to send agent token to client ${clientId}`, {
        method: 'handleAgentToken',
        store: 'agentStore'
      })
    }
  }
}

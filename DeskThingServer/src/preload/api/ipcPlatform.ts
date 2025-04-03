import { Client, ClientManifest } from '@deskthing/types'
import { PlatformIDs } from '@shared/stores/platformStore'
import { IPC_HANDLERS } from '@shared/types'
import { PlatformIPC, ExtractPayloadFromIPC } from '@shared/types/ipc/ipcPlatform'
import { ipcRenderer } from 'electron'

export const platform = {
  send: async <T extends PlatformIPC>(payload: T): Promise<ExtractPayloadFromIPC<T>> => {
    return sendPlatformData(payload)
  },
  adb: {
    getManifest: async (adbId: string): Promise<ClientManifest | undefined> => {
      return (
        (await sendPlatformData({
          platform: PlatformIDs.ADB,
          type: 'get',
          request: 'manifest',
          adbId
        })) || undefined
      )
    },
    setManifest: async (adbId: string, manifest: Partial<ClientManifest>): Promise<void> => {
      return sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'set',
        request: 'manifest',
        manifest,
        adbId
      })
    },
    setSupervisorStatus: async (
      adbId: string,
      service: string,
      state: boolean
    ): Promise<boolean | undefined> => {
      return await sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'set',
        request: 'supervisor',
        service,
        adbId,
        state
      })
    },

    pushStaged: async (adbId: string): Promise<boolean> =>
      (await sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'push',
        request: 'staged',
        adbId
      })) || false,
    pushScript: async (adbId: string, scriptId: 'proxy' | 'restart'): Promise<boolean> =>
      (await sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'push',
        request: 'script',
        scriptId,
        adbId
      })) || false,
    runCommand: async (adbId: string, command: string): Promise<string | undefined> =>
      await sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'run',
        request: 'command',
        command,
        adbId
      }),
    refresh: async () => {
      return sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'refresh',
        request: 'adb'
      })
    },
    configure: async (adbId: string): Promise<boolean> =>
      (await sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'configure',
        request: 'client',
        adbId
      })) || false
  },
  websocket: {
    ping: async (clientId: string): Promise<void> => {
      return sendPlatformData({
        platform: PlatformIDs.WEBSOCKET,
        type: 'ping',
        clientId
      })
    },
    pong: async (clientId: string): Promise<string | undefined> => {
      return sendPlatformData({
        platform: PlatformIDs.WEBSOCKET,
        type: 'pong',
        clientId
      })
    },
    disconnect: async (clientId: string): Promise<boolean> =>
      (await sendPlatformData({
        platform: PlatformIDs.WEBSOCKET,
        type: 'disconnect',
        clientId
      })) || false,
    restart: async (request?: string): Promise<void> => {
      return sendPlatformData({
        platform: PlatformIDs.WEBSOCKET,
        type: 'restart',
        request,
        payload: 'etc'
      })
    }
  },
  bluetooth: {
    doSomething: async (): Promise<void> => {
      return sendPlatformData({
        platform: PlatformIDs.BLUETOOTH,
        type: 'do-something',
        payload: 'etc'
      })
    }
  },
  refreshConnections: async (): Promise<Client[] | undefined> => {
    return sendPlatformData({
      platform: PlatformIDs.MAIN,
      type: 'refresh-clients'
    })
  }
}

const sendPlatformData = <T extends PlatformIPC>(payload: T): Promise<ExtractPayloadFromIPC<T>> => {
  return ipcRenderer.invoke(IPC_HANDLERS.PLATFORM, payload)
}

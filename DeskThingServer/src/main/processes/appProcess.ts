import {
  AppProcessData,
  AppToDeskThingData,
  DeskThingClass,
  DeskThingProcessData,
  DeskThingToAppData,
  LOGGING_LEVELS
} from '@deskthing/types'
import { resolve } from 'node:path'
import { parentPort } from 'worker_threads'

const sendMessage = (data: AppProcessData): void => {
  if (parentPort?.postMessage) {
    parentPort.postMessage(data)
  } else {
    console.error('Parent port or postmessage is undefined!')
  }
}

// ERROR HANDLING
process.on('uncaughtException', (error) => {
  // Send detailed error info to parent process
  sendMessage({
    version: '0.11.0',
    type: 'server:error',
    payload: error instanceof Error ? error : new Error(String(error))
  })

  // Don't exit immediately, give time for the error to be sent
  setTimeout(() => {
    process.exit(1)
  }, 200)
})

sendMessage({
  version: '0.11.0',
  type: 'server:log',
  payload: {
    level: LOGGING_LEVELS.LOG,
    message: `Process started.`,
    domain: 'app',
    source: 'APPPROCESS'
  }
})

process.on('unhandledRejection', (reason) => {
  // Send detailed rejection info to parent process
  const error = reason instanceof Error ? reason : new Error(String(reason))
  sendMessage({
    version: '0.11.0',
    type: 'server:error',
    payload: error
  })
})

process.on('SIGTERM', () => {
  process.exit(0)
})

// App Logic

const setupServer = async (): Promise<void> => {
  const serverPath = process.env.DESKTHING_URL
  const appName = process.env.DESKTHING_APP_NAME || 'unknown'

  process.title = appName
  if (!serverPath) {
    throw new Error('SERVER_INDEX_PATH is not defined!')
  }

  // keep alive

  const importDeskThing = async (): Promise<void> => {
    const { DeskThing } = (await import(`file://${resolve(serverPath)}`)) as {
      DeskThing: DeskThingClass
    }
    sendMessage({
      version: '0.11.0',
      type: 'server:log',
      payload: {
        level: LOGGING_LEVELS.LOG,
        message: 'DeskThing module loaded successfully.',
        domain: 'app',
        source: 'SERVER.' + appName.toUpperCase()
      }
    })

    // Handle messages from parent process
    parentPort?.on('message', async (data: DeskThingProcessData) => {
      switch (data.type) {
        case 'data':
          handleAppRequest(data.payload)
          break
        case 'start':
          sendMessage({
            version: '0.11.0',
            type: 'server:log',
            payload: {
              level: LOGGING_LEVELS.LOG,
              message: `Sending START to ${appName}.`,
              domain: 'app',
              source: 'SERVER.' + appName.toUpperCase()
            }
          })
          DeskThing.start?.({
            toServer: (payload: AppToDeskThingData) => {
              sendMessage({
                version: '0.10.3',
                type: 'data',
                payload
              }) // Send data to parent
            },
            SysEvents: () => {
              return () => {}
            }
          })
          sendMessage({
            version: '0.11.0',
            type: 'started'
          }) // Send data to parent
          break
        case 'stop':
          await DeskThing.stop?.()
          sendMessage({
            version: '0.11.0',
            type: 'stopped'
          }) // Send data to parent
          break
        case 'purge':
          DeskThing.purge?.()
          break
      }
    })

    async function handleAppRequest(data: DeskThingToAppData): Promise<void> {
      await DeskThing.toClient?.(data)
    }
  }

  await importDeskThing()
}
setupServer()

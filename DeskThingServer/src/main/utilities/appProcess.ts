import { DeskThingType, EventPayload, LOGGING_LEVELS, ToServerData } from '@deskthing/types'
import { FAppProcessPayload, TAppProcessPayload } from '@shared/stores/appProcessStore'
import { resolve } from 'node:path'
import dns from 'node:dns'
import { promisify } from 'node:util'

dns.setServers(['8.8.8.8', '1.1.1.1'])
const lookupAsync = promisify(dns.lookup)

console.log('The app is sandboxed: ', !!process.sandboxed)

const sendMessage = (data: FAppProcessPayload): void => {
  if (process.parentPort.postMessage) {
    process.parentPort.postMessage(data)
  } else {
    console.error('Parent port or postmessage is undefined!')
  }
}

// ERROR HANDLING
process.on('uncaughtException', (error) => {
  // Send detailed error info to parent process
  sendMessage({
    type: 'server:error',
    payload: error instanceof Error ? error : new Error(String(error))
  })

  // Don't exit immediately, give time for the error to be sent
  setTimeout(() => {
    process.exit(1)
  }, 200)
})

sendMessage({
  type: 'server:log',
  payload: {
    type: LOGGING_LEVELS.LOG,
    log: `Process started.`,
    options: {
      domain: 'SERVER.APPPROCESS'
    }
  }
})

process.on('unhandledRejection', (reason) => {
  // Send detailed rejection info to parent process
  const error = reason instanceof Error ? reason : new Error(String(reason))
  sendMessage({
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
  if (!serverPath) {
    throw new Error('SERVER_INDEX_PATH is not defined!')
  }

  // keep alive

  const importDeskThing = async (): Promise<void> => {
    const { DeskThing } = (await import(`file://${resolve(serverPath)}`)) as {
      DeskThing: DeskThingType
    }
    sendMessage({
      type: 'server:log',
      payload: {
        type: LOGGING_LEVELS.LOG,
        log: 'DeskThing module loaded successfully.',
        options: {
          domain: 'SERVER.' + appName.toUpperCase()
        }
      }
    })

    // Handle messages from parent process
    process.parentPort.on('message', async ({ data }: { data: TAppProcessPayload }) => {
      switch (data.type) {
        case 'data':
          handleAppRequest(data.payload)
          break
        case 'start':
          sendMessage({
            type: 'server:log',
            payload: {
              type: LOGGING_LEVELS.LOG,
              log: `Sending START to ${appName}.`,
              options: {
                domain: 'SERVER.' + appName.toUpperCase()
              }
            }
          })
          DeskThing.start({
            toServer: (payload: ToServerData) => {
              sendMessage({ type: 'data', payload }) // Send data to parent
            },
            SysEvents: () => {
              return () => {}
            }
          })
          sendMessage({ type: 'start' }) // Send data to parent
          break
        case 'stop':
          DeskThing.stop()
          break
        case 'purge':
          DeskThing.purge()
          break
      }
    })

    async function handleAppRequest(data: EventPayload): Promise<void> {
      await DeskThing.toClient(data)
    }
  }

  await importDeskThing()
}

setupServer()
import { net } from 'electron'
const testFetch = async (): Promise<void> => {
  try {
    console.log('Net is ', net.isOnline())
    const url =
      'http://localhost:8891/proxy/fetch/' + encodeURIComponent('https://picsum.photos/200')
    const response = await net.fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const blob = await response.blob()
    console.log('Fetch successful, content size:', blob.size)
  } catch (error) {
    console.error('Operation failed:', error)
    if (error instanceof Error && error.cause) {
      console.error('Root cause:', error.cause)
    }
  }
}
testFetch()

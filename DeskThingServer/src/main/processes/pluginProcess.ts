import { parentPort, workerData } from 'worker_threads'
import { pathToFileURL } from 'url'

type WorkerPayload = {
  filePath: string
  payloadType?: unknown
  operation: 'install' | 'uninstall'
  workerData?: unknown
}

if (!parentPort) {
  // not running inside a worker thread
  console.error('This script must be run inside a worker thread.')
  process.exit(1)
}

const data = workerData as WorkerPayload

function postMessage(...data: unknown[]): void {
  parentPort?.postMessage(data)
}


async function run(): Promise<void> {
  if (!parentPort) {
    // not running inside a worker thread
    process.exit(1)
  }

  const { filePath, operation, workerData: payload } = data

  try {
    postMessage({ level: 'info', message: `Loading module ${filePath}` })

    const moduleUrl = pathToFileURL(filePath).href
    const mod = await import(moduleUrl)

    const tryInvoke = async (): Promise<unknown> => {
      // 1) If module has a named export matching the operation, call it
      const named = mod[operation]
      if (typeof named === 'function') {
        postMessage({ level: 'info', message: `Invoking exported "${operation}"` })
        return await named(payload)
      }

      // 2) If default export is a function, try calling it.
      const def = mod.default
      if (typeof def === 'function') {
        postMessage({
          level: 'info',
          message: 'Invoking default export (attempt payload)'
        })
        try {
          return await def(payload)
        } catch {
          // If first signature fails, try calling with (operation, payload)
          postMessage({
            level: 'info',
            message: 'Default export failed with payload, trying (operation, payload)'
          })
          return await def(operation, payload)
        }
      }

      // 3) If default is an object and has the operation method, call it
      if (def && typeof def === 'object') {
        const method = def[operation]
        if (typeof method === 'function') {
          postMessage({ level: 'info', message: `Invoking default.${operation}` })
          return await method(payload)
        }
      }

      throw new Error(`No callable export found for operation "${operation}" in ${filePath}`)
    }

    await tryInvoke()

    postMessage({ level: 'info', message: 'Operation completed' })
    process.exit(0)
  } catch (err) {
    const e = err as Error
    postMessage({
      level: 'error',
      message: e.message,
      name: e.name,
      stack: e.stack
    })
    // ensure worker exits with non-zero code
    setImmediate(() => process.exit(1))
  }
}

run()

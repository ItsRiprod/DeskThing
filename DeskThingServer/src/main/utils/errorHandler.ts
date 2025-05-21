export const handleError = (error: unknown | Error): string => {
  let errorMessage = ''

  try {
    if (error instanceof Error) {
      const details = {
        message: error.message || 'No message',
        stack: error.stack || 'No stack trace',
        cause: error.cause || 'No cause',
        name: error.name || 'No name'
      }
      errorMessage = `Error: ${details.name} - ${details.message}. STACK: ${details.stack}. Cause: ${details.cause}.`
    } else if (typeof error === 'string') {
      errorMessage = `Error: ${error}.`
    } else if (error === null) {
      errorMessage = 'Error: Null value received.'
    } else if (error === undefined) {
      errorMessage = 'Error: Undefined value received.'
    } else if (typeof error === 'object') {
      try {
        const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error))
        errorMessage = `Error: ${serialized}.`
      } catch {
        errorMessage = `Error: [Object] - Unable to stringify. Type: ${Object.prototype.toString.call(error)}.`
      }
    } else {
      errorMessage = `Error: Unknown type (${typeof error}) - ${String(error)}.`
      console.log('Unable to determine type of', error)
    }
  } catch (e) {
    errorMessage = `Error processing error: ${e instanceof Error ? e.message : String(e)}. Original error: ${String(error)}.`
  }

  return errorMessage
}
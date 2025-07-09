process.on('unhandledRejection', (reason, promise) => {
  // Don't exit the process, just log the error
  console.error(`[process]: Unhandled Rejection at: ${promise}, reason: ${reason}`)
})

process.on('uncaughtException', (error) => {
  // Don't exit the process, just log the error
  console.error('[process]: Uncaught Exception: ', error)
})
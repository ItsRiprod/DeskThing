/**
 * IPC handler setup and management
 */
import { ipcMain } from 'electron'

/**
 * Sets up IPC handlers for communication between main and renderer processes
 */
export async function setupIpcHandlers(): Promise<void> {
  // Initialize all IPC handlers
  const { initializeIpcHandlers } = await import('../services/ipc/initializer')
  initializeIpcHandlers(ipcMain)
}

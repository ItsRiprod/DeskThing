import { BrowserWindow } from 'electron'
import { AppIPCData, ClientIPCData, ServerIPCData, UtilityIPCData } from '@shared/types'

export interface UIEventBus {
  setMainWindow(window: BrowserWindow): void
  emitAppEvent(data: AppIPCData): void
  emitClientEvent(data: ClientIPCData): void
  emitUtilityEvent(data: UtilityIPCData): void
  emitServerEvent(data: ServerIPCData): void
}

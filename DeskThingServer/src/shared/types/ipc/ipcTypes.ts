import { AppIPCData } from './ipcApps'
import { ClientIPCData } from './ipcClient'
import { UtilityIPCData } from './ipcUtility'

export enum IPC_HANDLERS {
  APPS = 'apps',
  CLIENT = 'client',
  DEVICE = 'device',
  FEEDBACK = 'feedback',
  PLATFORM = 'platform',
  RELEASE = 'releases',
  TASK = 'tasks',
  UPDATE = 'update',
  UTILITY = 'utility'
}

export type IPCData = AppIPCData | ClientIPCData | UtilityIPCData

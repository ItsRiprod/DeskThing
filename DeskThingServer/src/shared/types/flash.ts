import { type FlashEvent } from 'flashthing'

export enum FLASH_REQUEST {
  FILE_PATH = 'file_path',
  DEVICE_SELECTION = 'device_selection',
  STEPS = 'steps',
  STATE = 'state'
}

/**
 * Requests from the server to the flashThing process
 */
export type FlashServer =
  | {
      type: 'request'
      request: FLASH_REQUEST.STEPS
    }
  | {
      type: 'request'
      request: FLASH_REQUEST.STATE
    }
  | {
      type: 'operation'
      request: 'start'
    }
  | {
      type: 'operation'
      request: 'cancel'
    }
  | {
      type: 'operation'
      request: 'restart'
    }
  | {
      type: 'operation'
      request: 'unbrick'
    }
  | {
      type: 'response'
      request: FLASH_REQUEST.FILE_PATH
      payload: string
    }
  | {
      type: 'response'
      request: FLASH_REQUEST.DEVICE_SELECTION
      payload: string
    }

/**
 * Responses from the flashThing process to the server
 */
export type FlashProcess =
  | {
      type: 'flashEvent'
      payload: FlashEvent
    }
  | {
      type: 'request'
      request: FLASH_REQUEST.FILE_PATH
      payload: string
    }
  | {
      type: 'request'
      request: FLASH_REQUEST.DEVICE_SELECTION
      payload: string
    }
  | {
      type: 'response'
      request: FLASH_REQUEST.STEPS
      payload: number
    }
  | {
      type: 'response'
      request: FLASH_REQUEST.STATE
      payload: string
    }

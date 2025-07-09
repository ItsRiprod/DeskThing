import { type FlashEvent } from 'flashthing'

export type FlashingState = {
  step?: number
  stepTotal?: number
  stepTitle?: string
  pastTitles?: string[]
  progress: {
    percent?: number
    elapsedS?: number
    etaS?: number
    rate?: number
  }
  state?: 'progress' | 'completed' | 'error' | 'cancelled'
  errorText?: string
  suggestion?: string
}

export type AutoConfigResult =
  | {
      state: 'input'
      inputText: string
      nextStep: number
    }
  | {
      state: 'completed'
      successMessage: string
    }
  | {
      state: 'error'
      errorText: string
      resolutionSteps: string[]
    }

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
      type: 'operation'
      request: 'start'
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
      type: 'operation'
      request: 'complete'
    }
  | {
      type: 'operation'
      request: 'killed'
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

import { IPC_HANDLERS } from './ipcTypes'

/** Which link is actually carrying client traffic right now. */
export type BluetoothTransport = 'bluetooth' | 'usb' | 'none'

/** Which link the user wants to carry traffic when both are available. */
export type BluetoothPreference = 'bluetooth' | 'usb'

/**
 * Where a pairing exchange currently stands. `confirm` means the device is
 * showing a 6-digit code on its screen and the same code is in `pairing.code`,
 * waiting for the person to confirm or reject it here.
 */
export type BluetoothPairingStage =
  | 'idle'
  | 'discovering'
  | 'connecting'
  | 'confirm'
  | 'finishing'
  | 'done'
  | 'failed'

export interface BluetoothPairingState {
  stage: BluetoothPairingStage
  code: string | null
  error: string | null
}

/** A device seen during discovery. */
export interface BluetoothFoundDevice {
  address: string
  name: string
}

export interface BluetoothBridgeStatus {
  /** Whether this platform ships a Bluetooth bridge helper at all. */
  supported: boolean
  /** Whether the helper process is currently running. */
  running: boolean
  /** Whether an RFCOMM session to a device is established. */
  linkUp: boolean
  transport: BluetoothTransport
  preference: BluetoothPreference
  /** The device this bridge connects to, once known. */
  deviceAddress: string | null
  /** Whether that device is currently bonded with this computer. */
  paired: boolean
  pairing: BluetoothPairingState
  found: BluetoothFoundDevice[]
}

export interface BluetoothProvisionStep {
  id: string
  label: string
  ok: boolean
  detail?: string
}

export interface BluetoothProvisionResult {
  success: boolean
  steps: BluetoothProvisionStep[]
  /** The device's radio address, reported when provisioning succeeds. */
  deviceAddress?: string
}

export enum IPC_BLUETOOTH_TYPES {
  GET_STATUS = 'get-status',
  SET_PREFERENCE = 'set-preference',
  PROVISION_DEVICE = 'provision-device',
  DISCOVER = 'discover',
  PAIR = 'pair',
  PAIR_REPLY = 'pair-reply',
  UNPAIR = 'unpair'
}

export type BluetoothIPCData = {
  kind: IPC_HANDLERS.BLUETOOTH
} & (
  | {
      type: IPC_BLUETOOTH_TYPES.GET_STATUS
      request: 'get'
    }
  | {
      type: IPC_BLUETOOTH_TYPES.SET_PREFERENCE
      request: 'set'
      payload: BluetoothPreference
    }
  | {
      type: IPC_BLUETOOTH_TYPES.PROVISION_DEVICE
      request: 'set'
      payload: { adbId: string }
    }
  | {
      type: IPC_BLUETOOTH_TYPES.DISCOVER
      request: 'set'
    }
  | {
      type: IPC_BLUETOOTH_TYPES.PAIR
      request: 'set'
      payload: { address: string }
    }
  | {
      type: IPC_BLUETOOTH_TYPES.PAIR_REPLY
      request: 'set'
      payload: { accept: boolean }
    }
  | {
      type: IPC_BLUETOOTH_TYPES.UNPAIR
      request: 'set'
      payload: { address: string }
    }
)

export type BluetoothHandlerReturnMap = {
  [IPC_BLUETOOTH_TYPES.GET_STATUS]: BluetoothBridgeStatus
  [IPC_BLUETOOTH_TYPES.SET_PREFERENCE]: BluetoothBridgeStatus
  [IPC_BLUETOOTH_TYPES.PROVISION_DEVICE]: BluetoothProvisionResult
  [IPC_BLUETOOTH_TYPES.DISCOVER]: BluetoothBridgeStatus
  [IPC_BLUETOOTH_TYPES.PAIR]: BluetoothBridgeStatus
  [IPC_BLUETOOTH_TYPES.PAIR_REPLY]: BluetoothBridgeStatus
  [IPC_BLUETOOTH_TYPES.UNPAIR]: BluetoothBridgeStatus
}

export type BluetoothHandlerReturnType<K extends IPC_BLUETOOTH_TYPES> = BluetoothHandlerReturnMap[K]

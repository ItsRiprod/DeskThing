import {
  BluetoothBridgeStatus,
  BluetoothPreference,
  BluetoothProvisionResult
} from '@shared/types'
import {
  bridgeBinaryExists,
  isBridgeRunning,
  startBridgeProcess,
  stopBridgeProcess
} from './bridgeProcess'
import {
  fetchBridgeState,
  pushBridgePreference,
  removeBridgePairing,
  replyBridgePairing,
  setBridgeDevice,
  startBridgeDiscovery,
  startBridgePairing
} from './bridgeClient'
import { provisionDevice } from './provisioner'

/**
 * Platform-neutral entry point for the Bluetooth transport.
 *
 * Everything outside this directory — lifecycle, IPC, UI — talks to this
 * interface only. Supporting a new OS means shipping a helper that speaks
 * the same control API under bt_source/<platform>/; no call sites change.
 */
export interface BluetoothTransportManager {
  start(): void
  stop(): void
  getStatus(): Promise<BluetoothBridgeStatus>
  setPreference(preference: BluetoothPreference): Promise<BluetoothBridgeStatus>
  provision(adbId: string): Promise<BluetoothProvisionResult>
  discover(): Promise<BluetoothBridgeStatus>
  pair(address: string): Promise<BluetoothBridgeStatus>
  pairReply(accept: boolean): Promise<BluetoothBridgeStatus>
  unpair(address: string): Promise<BluetoothBridgeStatus>
}

const IDLE_PAIRING = { stage: 'idle' as const, code: null, error: null }

const UNSUPPORTED_STATUS: BluetoothBridgeStatus = {
  supported: false,
  running: false,
  linkUp: false,
  transport: 'none',
  preference: 'bluetooth',
  deviceAddress: null,
  paired: false,
  pairing: IDLE_PAIRING,
  found: []
}

/** A helper shipped in Resources/<platform>, supervised by us. */
const helperBridgeManager: BluetoothTransportManager = {
  start: startBridgeProcess,
  stop: stopBridgeProcess,

  getStatus: async (): Promise<BluetoothBridgeStatus> => {
    const running = isBridgeRunning()
    const state = running ? await fetchBridgeState() : null
    return {
      supported: true,
      running,
      linkUp: state?.linkUp ?? false,
      transport: state?.transport ?? 'none',
      preference: state?.preference ?? 'bluetooth',
      deviceAddress: state?.deviceAddress ?? null,
      paired: state?.paired ?? false,
      pairing: state?.pairing ?? IDLE_PAIRING,
      found: state?.found ?? []
    }
  },

  setPreference: async (preference): Promise<BluetoothBridgeStatus> => {
    await pushBridgePreference(preference)
    return helperBridgeManager.getStatus()
  },

  provision: async (adbId): Promise<BluetoothProvisionResult> => {
    const result = await provisionDevice(adbId)
    // Hand the freshly provisioned device to the helper so the pairing wizard
    // and the reconnect loop know who to talk to.
    if (result.success && result.deviceAddress) {
      await setBridgeDevice(result.deviceAddress)
    }
    return result
  },

  discover: async (): Promise<BluetoothBridgeStatus> => {
    await startBridgeDiscovery()
    return helperBridgeManager.getStatus()
  },

  pair: async (address): Promise<BluetoothBridgeStatus> => {
    await startBridgePairing(address)
    return helperBridgeManager.getStatus()
  },

  pairReply: async (accept): Promise<BluetoothBridgeStatus> => {
    await replyBridgePairing(accept)
    return helperBridgeManager.getStatus()
  },

  unpair: async (address): Promise<BluetoothBridgeStatus> => {
    await removeBridgePairing(address)
    return helperBridgeManager.getStatus()
  }
}

/** Platforms without a helper: report unsupported, never fail. */
const unsupportedManager: BluetoothTransportManager = {
  start: (): void => {},
  stop: (): void => {},
  getStatus: async (): Promise<BluetoothBridgeStatus> => UNSUPPORTED_STATUS,
  setPreference: async (): Promise<BluetoothBridgeStatus> => UNSUPPORTED_STATUS,
  provision: async (): Promise<BluetoothProvisionResult> => ({
    success: false,
    steps: [
      {
        id: 'unsupported',
        label: 'Bluetooth transport',
        ok: false,
        detail: 'No Bluetooth bridge is available for this operating system yet'
      }
    ]
  }),
  discover: async (): Promise<BluetoothBridgeStatus> => UNSUPPORTED_STATUS,
  pair: async (): Promise<BluetoothBridgeStatus> => UNSUPPORTED_STATUS,
  pairReply: async (): Promise<BluetoothBridgeStatus> => UNSUPPORTED_STATUS,
  unpair: async (): Promise<BluetoothBridgeStatus> => UNSUPPORTED_STATUS
}

export const bluetoothManager: BluetoothTransportManager = bridgeBinaryExists()
  ? helperBridgeManager
  : unsupportedManager

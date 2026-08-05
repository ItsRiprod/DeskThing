import {
  BluetoothFoundDevice,
  BluetoothPairingState,
  BluetoothPreference,
  BluetoothTransport
} from '@shared/types'

/**
 * Client for the bridge helper's local control API.
 *
 * The helper owns the RFCOMM link, pairing, and the USB-reverse arbitration,
 * and exposes its state on a loopback port. This module is the only place
 * that knows that protocol; everything else in the app goes through the
 * manager.
 */

const CONTROL_URL = 'http://127.0.0.1:8899'
const TIMEOUT_MS = 3000

export interface BridgeControlState {
  preference: BluetoothPreference
  transport: BluetoothTransport
  linkUp: boolean
  deviceAddress: string | null
  paired: boolean
  pairing: BluetoothPairingState
  found: BluetoothFoundDevice[]
}

const request = async (path: string, init?: RequestInit): Promise<BridgeControlState | null> => {
  try {
    const res = await fetch(`${CONTROL_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })
    if (!res.ok) return null
    return (await res.json()) as BridgeControlState
  } catch {
    return null
  }
}

const post = (path: string, body?: object): Promise<BridgeControlState | null> =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {})
  })

/** Returns the helper's live state, or null when the helper isn't reachable. */
export const fetchBridgeState = (): Promise<BridgeControlState | null> => request('/status')

/** Sets the transport preference; returns the resulting state or null. */
export const pushBridgePreference = (
  preference: BluetoothPreference
): Promise<BridgeControlState | null> => post('/preference', { preference })

/** Starts an inquiry for nearby devices; results appear in later /status polls. */
export const startBridgeDiscovery = (): Promise<BridgeControlState | null> => post('/discover')

/** Starts computer-initiated pairing with a device. */
export const startBridgePairing = (address: string): Promise<BridgeControlState | null> =>
  post('/pair', { address })

/** Answers the numeric-comparison prompt of an in-flight pairing. */
export const replyBridgePairing = (accept: boolean): Promise<BridgeControlState | null> =>
  post('/pair/reply', { accept })

/** Removes the bond for a device (also clears it as the connect target). */
export const removeBridgePairing = (address: string): Promise<BridgeControlState | null> =>
  post('/unpair', { address })

/** Tells the helper which device to keep connecting to. */
export const setBridgeDevice = (address: string): Promise<BridgeControlState | null> =>
  post('/device', { address })

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchBridgeState,
  pushBridgePreference,
  removeBridgePairing,
  replyBridgePairing,
  setBridgeDevice,
  startBridgeDiscovery,
  startBridgePairing
} from '../../../../src/main/services/bluetooth/bridgeClient'

const STATE = {
  preference: 'bluetooth',
  transport: 'bluetooth',
  linkUp: true,
  deviceAddress: 'aa-bb-cc-dd-ee-ff',
  paired: true,
  pairing: { stage: 'idle', code: null, error: null },
  found: []
}

const okResponse = (): Response =>
  ({ ok: true, json: async () => STATE }) as unknown as Response

describe('bridgeClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches /status and returns the parsed state', async () => {
    fetchMock.mockResolvedValue(okResponse())
    const state = await fetchBridgeState()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8899/status',
      expect.objectContaining({ signal: expect.anything() })
    )
    expect(state).toEqual(STATE)
  })

  it.each([
    ['preference', () => pushBridgePreference('usb'), '/preference', { preference: 'usb' }],
    ['discover', () => startBridgeDiscovery(), '/discover', {}],
    ['pair', () => startBridgePairing('AA:BB'), '/pair', { address: 'AA:BB' }],
    ['pair reply', () => replyBridgePairing(true), '/pair/reply', { accept: true }],
    ['unpair', () => removeBridgePairing('AA:BB'), '/unpair', { address: 'AA:BB' }],
    ['device', () => setBridgeDevice('AA:BB'), '/device', { address: 'AA:BB' }]
  ])('POSTs %s to the right endpoint with the right body', async (_name, call, path, body) => {
    fetchMock.mockResolvedValue(okResponse())
    await call()
    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:8899${path}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body)
      })
    )
  })

  it('returns null when the helper is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))
    expect(await fetchBridgeState()).toBeNull()
  })

  it('returns null on a non-OK response', async () => {
    fetchMock.mockResolvedValue({ ok: false } as Response)
    expect(await fetchBridgeState()).toBeNull()
  })
})

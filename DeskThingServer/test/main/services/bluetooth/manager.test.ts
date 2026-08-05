import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() }
}))

const processMock = vi.hoisted(() => ({
  bridgeBinaryExists: vi.fn(() => true),
  isBridgeRunning: vi.fn(() => true),
  startBridgeProcess: vi.fn(),
  stopBridgeProcess: vi.fn(),
  bridgeBinaryPath: '/tmp/btbridge',
  deviceMuxScriptPath: '/tmp/btmux.py',
  deviceAgentScriptPath: '/tmp/btagent.py'
}))
vi.mock('../../../../src/main/services/bluetooth/bridgeProcess', () => processMock)

const clientMock = vi.hoisted(() => ({
  fetchBridgeState: vi.fn(),
  pushBridgePreference: vi.fn(),
  startBridgeDiscovery: vi.fn(),
  startBridgePairing: vi.fn(),
  replyBridgePairing: vi.fn(),
  removeBridgePairing: vi.fn(),
  setBridgeDevice: vi.fn()
}))
vi.mock('../../../../src/main/services/bluetooth/bridgeClient', () => clientMock)

const provisionMock = vi.hoisted(() => vi.fn())
vi.mock('../../../../src/main/services/bluetooth/provisioner', () => ({
  provisionDevice: provisionMock
}))

import { bluetoothManager } from '../../../../src/main/services/bluetooth'

const HELPER_STATE = {
  preference: 'bluetooth' as const,
  transport: 'bluetooth' as const,
  linkUp: true,
  deviceAddress: 'aa-bb-cc-dd-ee-ff',
  paired: true,
  pairing: { stage: 'idle' as const, code: null, error: null },
  found: [{ address: 'aa-bb-cc-dd-ee-ff', name: 'Car Thing' }]
}

describe('bluetoothManager (helper present)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    processMock.isBridgeRunning.mockReturnValue(true)
    clientMock.fetchBridgeState.mockResolvedValue(HELPER_STATE)
  })

  it('reports supported with the helper state merged in', async () => {
    const status = await bluetoothManager.getStatus()
    expect(status).toMatchObject({
      supported: true,
      running: true,
      linkUp: true,
      transport: 'bluetooth',
      deviceAddress: 'aa-bb-cc-dd-ee-ff',
      paired: true
    })
    expect(status.found).toHaveLength(1)
  })

  it('degrades to safe defaults when the helper is not running', async () => {
    processMock.isBridgeRunning.mockReturnValue(false)
    const status = await bluetoothManager.getStatus()
    expect(status).toMatchObject({
      supported: true,
      running: false,
      linkUp: false,
      transport: 'none',
      deviceAddress: null,
      paired: false
    })
    expect(clientMock.fetchBridgeState).not.toHaveBeenCalled()
  })

  it('degrades to safe defaults when the control API is unreachable', async () => {
    clientMock.fetchBridgeState.mockResolvedValue(null)
    const status = await bluetoothManager.getStatus()
    expect(status.linkUp).toBe(false)
    expect(status.pairing.stage).toBe('idle')
  })

  it('pushes the preference then re-reads status', async () => {
    await bluetoothManager.setPreference('usb')
    expect(clientMock.pushBridgePreference).toHaveBeenCalledWith('usb')
    expect(clientMock.fetchBridgeState).toHaveBeenCalled()
  })

  it('hands the provisioned device address to the helper', async () => {
    provisionMock.mockResolvedValue({
      success: true,
      steps: [],
      deviceAddress: '30:E3:D6:05:78:45'
    })
    const result = await bluetoothManager.provision('serial')
    expect(result.success).toBe(true)
    expect(clientMock.setBridgeDevice).toHaveBeenCalledWith('30:E3:D6:05:78:45')
  })

  it('does not touch the helper when provisioning fails', async () => {
    provisionMock.mockResolvedValue({ success: false, steps: [] })
    await bluetoothManager.provision('serial')
    expect(clientMock.setBridgeDevice).not.toHaveBeenCalled()
  })

  it('forwards pairing calls to the helper', async () => {
    await bluetoothManager.pair('AA:BB')
    expect(clientMock.startBridgePairing).toHaveBeenCalledWith('AA:BB')
    await bluetoothManager.pairReply(true)
    expect(clientMock.replyBridgePairing).toHaveBeenCalledWith(true)
    await bluetoothManager.unpair('AA:BB')
    expect(clientMock.removeBridgePairing).toHaveBeenCalledWith('AA:BB')
    await bluetoothManager.discover()
    expect(clientMock.startBridgeDiscovery).toHaveBeenCalled()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BluetoothBridgeStatus,
  BluetoothIPCData,
  IPC_BLUETOOTH_TYPES,
  IPC_HANDLERS
} from '../../../../src/shared/types'

const managerMock = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  getStatus: vi.fn(),
  setPreference: vi.fn(),
  provision: vi.fn(),
  discover: vi.fn(),
  pair: vi.fn(),
  pairReply: vi.fn(),
  unpair: vi.fn()
}))

vi.mock('@server/services/bluetooth', () => ({ bluetoothManager: managerMock }))

import { bluetoothHandler } from '../../../../src/main/services/ipc/bluetoothIpc'

const STATUS: BluetoothBridgeStatus = {
  supported: true,
  running: true,
  linkUp: true,
  transport: 'bluetooth',
  preference: 'bluetooth',
  deviceAddress: 'AA:BB:CC:DD:EE:FF',
  paired: true,
  pairing: { stage: 'idle', code: null, error: null },
  found: []
}

describe('bluetoothHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes GET_STATUS to the manager', async () => {
    managerMock.getStatus.mockResolvedValue(STATUS)
    const result = await bluetoothHandler({
      kind: IPC_HANDLERS.BLUETOOTH,
      type: IPC_BLUETOOTH_TYPES.GET_STATUS,
      request: 'get'
    })
    expect(managerMock.getStatus).toHaveBeenCalledOnce()
    expect(result).toBe(STATUS)
  })

  it('routes SET_PREFERENCE with the chosen preference', async () => {
    managerMock.setPreference.mockResolvedValue(STATUS)
    await bluetoothHandler({
      kind: IPC_HANDLERS.BLUETOOTH,
      type: IPC_BLUETOOTH_TYPES.SET_PREFERENCE,
      request: 'set',
      payload: 'usb'
    })
    expect(managerMock.setPreference).toHaveBeenCalledWith('usb')
  })

  it('routes PROVISION_DEVICE with the adb id', async () => {
    managerMock.provision.mockResolvedValue({ success: true, steps: [] })
    await bluetoothHandler({
      kind: IPC_HANDLERS.BLUETOOTH,
      type: IPC_BLUETOOTH_TYPES.PROVISION_DEVICE,
      request: 'set',
      payload: { adbId: 'serial123' }
    })
    expect(managerMock.provision).toHaveBeenCalledWith('serial123')
  })

  it('routes DISCOVER to the manager', async () => {
    managerMock.discover.mockResolvedValue(STATUS)
    await bluetoothHandler({
      kind: IPC_HANDLERS.BLUETOOTH,
      type: IPC_BLUETOOTH_TYPES.DISCOVER,
      request: 'set'
    })
    expect(managerMock.discover).toHaveBeenCalledOnce()
  })

  it('routes PAIR with the target address', async () => {
    managerMock.pair.mockResolvedValue(STATUS)
    await bluetoothHandler({
      kind: IPC_HANDLERS.BLUETOOTH,
      type: IPC_BLUETOOTH_TYPES.PAIR,
      request: 'set',
      payload: { address: 'AA:BB:CC:DD:EE:FF' }
    })
    expect(managerMock.pair).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF')
  })

  it('routes PAIR_REPLY with the accept flag', async () => {
    managerMock.pairReply.mockResolvedValue(STATUS)
    await bluetoothHandler({
      kind: IPC_HANDLERS.BLUETOOTH,
      type: IPC_BLUETOOTH_TYPES.PAIR_REPLY,
      request: 'set',
      payload: { accept: false }
    })
    expect(managerMock.pairReply).toHaveBeenCalledWith(false)
  })

  it('routes UNPAIR with the target address', async () => {
    managerMock.unpair.mockResolvedValue(STATUS)
    await bluetoothHandler({
      kind: IPC_HANDLERS.BLUETOOTH,
      type: IPC_BLUETOOTH_TYPES.UNPAIR,
      request: 'set',
      payload: { address: 'AA:BB:CC:DD:EE:FF' }
    })
    expect(managerMock.unpair).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF')
  })

  it('covers every declared IPC type', async () => {
    // If a new IPC type is added without a handler branch, the switch returns
    // undefined — catch that here rather than in production.
    const calls: Record<IPC_BLUETOOTH_TYPES, BluetoothIPCData> = {
      [IPC_BLUETOOTH_TYPES.GET_STATUS]: {
        kind: IPC_HANDLERS.BLUETOOTH,
        type: IPC_BLUETOOTH_TYPES.GET_STATUS,
        request: 'get'
      },
      [IPC_BLUETOOTH_TYPES.SET_PREFERENCE]: {
        kind: IPC_HANDLERS.BLUETOOTH,
        type: IPC_BLUETOOTH_TYPES.SET_PREFERENCE,
        request: 'set',
        payload: 'bluetooth'
      },
      [IPC_BLUETOOTH_TYPES.PROVISION_DEVICE]: {
        kind: IPC_HANDLERS.BLUETOOTH,
        type: IPC_BLUETOOTH_TYPES.PROVISION_DEVICE,
        request: 'set',
        payload: { adbId: 'x' }
      },
      [IPC_BLUETOOTH_TYPES.DISCOVER]: {
        kind: IPC_HANDLERS.BLUETOOTH,
        type: IPC_BLUETOOTH_TYPES.DISCOVER,
        request: 'set'
      },
      [IPC_BLUETOOTH_TYPES.PAIR]: {
        kind: IPC_HANDLERS.BLUETOOTH,
        type: IPC_BLUETOOTH_TYPES.PAIR,
        request: 'set',
        payload: { address: 'x' }
      },
      [IPC_BLUETOOTH_TYPES.PAIR_REPLY]: {
        kind: IPC_HANDLERS.BLUETOOTH,
        type: IPC_BLUETOOTH_TYPES.PAIR_REPLY,
        request: 'set',
        payload: { accept: true }
      },
      [IPC_BLUETOOTH_TYPES.UNPAIR]: {
        kind: IPC_HANDLERS.BLUETOOTH,
        type: IPC_BLUETOOTH_TYPES.UNPAIR,
        request: 'set',
        payload: { address: 'x' }
      }
    }
    for (const method of Object.values(managerMock)) {
      if ('mockResolvedValue' in method) method.mockResolvedValue(STATUS)
    }
    for (const data of Object.values(calls)) {
      await expect(bluetoothHandler(data)).resolves.toBeDefined()
    }
  })
})

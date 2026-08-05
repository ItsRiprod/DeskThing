import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() }
}))

const adbMock = vi.hoisted(() => vi.fn())
vi.mock('@server/handlers/adbHandler', () => ({
  handleAdbCommands: adbMock
}))

vi.mock('../../../../src/main/services/bluetooth/bridgeProcess', () => ({
  deviceMuxScriptPath: '/resources/superbird/btmux.py',
  deviceAgentScriptPath: '/resources/superbird/btagent.py'
}))

import { provisionDevice } from '../../../../src/main/services/bluetooth/provisioner'

/** Route adb calls to canned replies keyed by a substring of the command. */
const cannedAdb = (overrides: Record<string, string | Error> = {}): void => {
  adbMock.mockImplementation(async (cmd: string) => {
    for (const [key, value] of Object.entries(overrides)) {
      if (cmd.includes(key)) {
        if (value instanceof Error) throw value
        return value
      }
    }
    if (cmd.includes('supervisorctl status')) return 'btmux RUNNING\nbtagent RUNNING'
    if (cmd.includes('hciconfig')) {
      return 'hci0: UP RUNNING PSCAN ISCAN\n\tBD Address: 30:E3:D6:05:78:45'
    }
    if (cmd.includes('sdptool browse')) return 'Service Name: Serial Port'
    if (cmd.includes('cat /etc/start_bluetoothd.sh')) return 'bluetoothd -n -d --compat'
    return ''
  })
}

describe('provisionDevice', () => {
  beforeEach(() => {
    adbMock.mockReset()
  })

  it('runs the full sequence and reports the device radio address', async () => {
    cannedAdb()
    const result = await provisionDevice('serial123')
    expect(result.success).toBe(true)
    expect(result.deviceAddress).toBe('30:E3:D6:05:78:45')
    const ids = result.steps.map((s) => s.id)
    expect(ids).toEqual([
      'remount',
      'push-mux',
      'supervisor',
      'bluetoothd-compat',
      'start-services',
      'verify-radio',
      'read-address'
    ])
    expect(result.steps.every((s) => s.ok)).toBe(true)
  })

  it('targets every adb call at the requested device', async () => {
    cannedAdb()
    await provisionDevice('serial123')
    for (const call of adbMock.mock.calls) {
      expect(call[0]).toMatch(/^-s serial123 /)
    }
  })

  it('installs both the mux and the pairing agent', async () => {
    cannedAdb()
    await provisionDevice('serial123')
    const pushes = adbMock.mock.calls.map((c) => c[0]).filter((c: string) => c.includes('push'))
    expect(pushes.some((c: string) => c.includes('btmux.py'))).toBe(true)
    expect(pushes.some((c: string) => c.includes('btagent.py'))).toBe(true)
    const confs = adbMock.mock.calls.map((c) => c[0]).filter((c: string) => c.includes('supervisor.d'))
    expect(confs.some((c: string) => c.includes('btmux.conf'))).toBe(true)
    expect(confs.some((c: string) => c.includes('btagent.conf'))).toBe(true)
  })

  it('stops at the first failing step and reports it', async () => {
    cannedAdb({ 'mount -o remount': new Error('device is read-only') })
    const result = await provisionDevice('serial123')
    expect(result.success).toBe(false)
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0]).toMatchObject({ id: 'remount', ok: false })
    expect(result.deviceAddress).toBeUndefined()
  })

  it('fails verify-radio when page scan is off', async () => {
    cannedAdb({ hciconfig: 'hci0: UP RUNNING ISCAN\n\tBD Address: 30:E3:D6:05:78:45' })
    const result = await provisionDevice('serial123')
    expect(result.success).toBe(false)
    expect(result.steps.at(-1)).toMatchObject({ id: 'verify-radio', ok: false })
  })

  it('patches bluetoothd only when compat is missing', async () => {
    cannedAdb({ 'cat /etc/start_bluetoothd.sh': 'bluetoothd -n -d' })
    const result = await provisionDevice('serial123')
    expect(result.success).toBe(true)
    const step = result.steps.find((s) => s.id === 'bluetoothd-compat')
    expect(step?.detail).toBe('patched and restarted')
    expect(adbMock.mock.calls.some((c) => (c[0] as string).includes('sed -i'))).toBe(true)
  })

  it('fails read-address when the radio address is unreadable', async () => {
    cannedAdb({ hciconfig: 'hci0: UP RUNNING PSCAN ISCAN' })
    const result = await provisionDevice('serial123')
    // verify-radio passes (PSCAN present) but read-address cannot parse.
    expect(result.success).toBe(false)
    expect(result.steps.at(-1)).toMatchObject({ id: 'read-address', ok: false })
  })
})

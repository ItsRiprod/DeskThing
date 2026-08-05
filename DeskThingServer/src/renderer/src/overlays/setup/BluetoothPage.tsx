import SponsorButton from '@renderer/components/SponsorButton'
import Button from '@renderer/components/Button'
import { IconBluetooth, IconRefresh } from '@renderer/assets/icons'
import { useClientStore } from '@renderer/stores'
import { TransportSelector } from '@renderer/overlays/modals/DeviceDetails/TransportSelector'
import { ClientConnectionMethod } from '@deskthing/types'
import { BluetoothBridgeStatus, BluetoothProvisionResult } from '@shared/types'
import React, { useEffect, useState } from 'react'

const POLL_MS = 2000

/**
 * Bluetooth setup, in the shape the Car Thing originally shipped with:
 * this computer asks to connect, the device's screen shows a 6-digit code,
 * and the person confirms the same code here. Once paired, the device
 * reconnects by itself every time it powers up.
 */
const BluetoothPage: React.FC = () => {
  const [status, setStatus] = useState<BluetoothBridgeStatus | null>(null)
  const clients = useClientStore((store) => store.clients)
  const refreshDevices = useClientStore((store) => store.requestADBDevices)
  const [refreshing, setRefreshing] = useState(false)
  const [provisioning, setProvisioning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, BluetoothProvisionResult>>({})
  const [busy, setBusy] = useState(false)

  const adbDevices = clients.filter(
    (client) => client.manifest?.context.method === ClientConnectionMethod.ADB
  )

  useEffect(() => {
    let cancelled = false
    const refresh = async (): Promise<void> => {
      try {
        const s = await window.electron.bluetooth.getStatus()
        if (!cancelled) setStatus(s)
      } catch {
        if (!cancelled) setStatus(null)
      }
    }
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const call = async (fn: () => Promise<BluetoothBridgeStatus>): Promise<void> => {
    setBusy(true)
    try {
      setStatus(await fn())
    } finally {
      setBusy(false)
    }
  }

  const handleRefreshDevices = async (): Promise<void> => {
    setRefreshing(true)
    await refreshDevices()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleProvision = async (adbId: string): Promise<void> => {
    setProvisioning(adbId)
    try {
      const result = await window.electron.bluetooth.provision(adbId)
      setResults((prev) => ({ ...prev, [adbId]: result }))
    } finally {
      setProvisioning(null)
    }
  }

  const pairing = status?.pairing
  const carThings = status?.found.filter(
    (d) => /car\s*thing|superbird/i.test(d.name) || d.address === status?.deviceAddress
  )
  const others = status?.found.filter((d) => carThings && !carThings.includes(d))

  return (
    <div className="w-full h-full p-8 flex flex-col overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Bluetooth Settings</h1>
      <div className="w-full flex-col flex items-center h-full space-y-8">
        {status && !status.supported ? (
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center border border-green-500/20 max-w-2xl">
            <p className="text-xl text-gray-300 mb-2">
              The Bluetooth transport is not available on this computer.
            </p>
            <p className="text-gray-400">
              Your Car Thing will continue to work normally over its USB cable.
            </p>
          </div>
        ) : (
          <>
            <div className="w-full max-w-2xl">
              <TransportSelector />
            </div>

            {/* Pairing */}
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-green-500/20 w-full max-w-2xl">
              <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                <IconBluetooth className="text-sky-400" iconSize={22} />
                Pair with a Car Thing
              </h2>

              {status?.paired && status.deviceAddress && pairing?.stage !== 'confirm' ? (
                <div>
                  <p className="text-gray-300 mt-2">
                    Paired with <span className="font-mono">{status.deviceAddress}</span>.{' '}
                    {status.linkUp
                      ? 'Connected — the device only needs power.'
                      : 'It will connect by itself whenever it has power and is in range.'}
                  </p>
                  <Button
                    disabled={busy}
                    onClick={() => call(() => window.electron.bluetooth.unpair(status.deviceAddress!))}
                    className="mt-3 border border-red-500/60 hover:bg-red-500/20 text-red-400 text-sm"
                  >
                    Unpair this device
                  </Button>
                </div>
              ) : pairing?.stage === 'confirm' && pairing.code ? (
                <div className="text-center py-4">
                  <p className="text-gray-300 mb-3">
                    Your Car Thing is showing this code on its screen. Make sure it matches:
                  </p>
                  <p className="text-5xl font-mono tracking-[0.4em] text-white mb-6">
                    {pairing.code}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      disabled={busy}
                      onClick={() => call(() => window.electron.bluetooth.pairReply(true))}
                      className="border border-green-500 hover:bg-green-500 px-6"
                    >
                      The codes match — Pair
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => call(() => window.electron.bluetooth.pairReply(false))}
                      className="border border-red-500/60 hover:bg-red-500/20 text-red-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : pairing?.stage === 'connecting' || pairing?.stage === 'finishing' ? (
                <p className="text-gray-300 py-4">Pairing… watch the device screen for a code.</p>
              ) : (
                <div>
                  <p className="text-gray-400 text-sm mt-1 mb-4">
                    {pairing?.stage === 'failed' && pairing.error && (
                      <span className="text-red-400 block mb-2">
                        Pairing failed: {pairing.error}. Try again.
                      </span>
                    )}
                    Scan for the device, then pair — a matching 6-digit code appears on the Car
                    Thing&apos;s screen and here. The device must be powered on and set up once over
                    USB (below).
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    On macOS, if the system shows its own Bluetooth pairing request, confirm it there
                    and check the code matches the device screen — that completes pairing too.
                  </p>
                  <div className="flex gap-3 items-center flex-wrap">
                    <Button
                      disabled={busy || pairing?.stage === 'discovering'}
                      onClick={() => call(() => window.electron.bluetooth.discover())}
                      className="border border-sky-500 hover:bg-sky-500"
                    >
                      {pairing?.stage === 'discovering' ? 'Scanning…' : 'Scan for devices'}
                    </Button>
                    {status?.deviceAddress && (
                      <Button
                        disabled={busy}
                        onClick={() => call(() => window.electron.bluetooth.pair(status.deviceAddress!))}
                        className="border border-green-500 hover:bg-green-500"
                      >
                        Pair with known device ({status.deviceAddress})
                      </Button>
                    )}
                  </div>
                  {(carThings?.length || 0) + (others?.length || 0) > 0 && (
                    <ul className="mt-4 space-y-2">
                      {[...(carThings ?? []), ...(others ?? [])].map((d) => (
                        <li
                          key={d.address}
                          className="flex justify-between items-center bg-zinc-900 rounded-md px-4 py-2"
                        >
                          <span className="text-gray-300">
                            {d.name} <span className="text-gray-500 font-mono">{d.address}</span>
                          </span>
                          <Button
                            disabled={busy}
                            onClick={() => call(() => window.electron.bluetooth.pair(d.address))}
                            className="border border-green-500 hover:bg-green-500 text-sm"
                          >
                            Pair
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* One-time USB provisioning */}
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-green-500/20 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">First-time Setup (USB)</h2>
                <Button
                  className={refreshing ? 'text-gray-300' : 'hover:bg-zinc-900'}
                  onClick={handleRefreshDevices}
                >
                  <IconRefresh className={refreshing ? 'animate-spin' : ''} />
                  <p className="text-nowrap">Find Devices</p>
                </Button>
              </div>
              <p className="text-gray-300 mb-1">
                Done once per device, over the USB cable: installs the Bluetooth service so the Car
                Thing can reach this computer wirelessly from then on.
              </p>
              <p className="text-gray-400 text-sm mb-4">
                After this finishes, pair above — then the cable is only ever needed for power.
              </p>

              {adbDevices.length === 0 ? (
                <p className="text-gray-500 italic">
                  No ADB devices connected. Plug the Car Thing in over USB and hit Find Devices.
                </p>
              ) : (
                <div className="space-y-4">
                  {adbDevices.map((device) => {
                    const adbId = device.meta.adb?.adbId
                    if (!adbId) return null
                    const result = results[adbId]
                    return (
                      <div key={adbId} className="bg-zinc-900 rounded-md p-4">
                        <div className="flex justify-between items-center">
                          <p className="text-white font-medium">{adbId}</p>
                          <Button
                            disabled={provisioning !== null}
                            onClick={() => handleProvision(adbId)}
                            className="border border-green-500 hover:bg-green-500 text-nowrap"
                          >
                            {provisioning === adbId ? 'Setting up…' : 'Set up Bluetooth'}
                          </Button>
                        </div>
                        {result && (
                          <ul className="mt-3 space-y-1">
                            {result.steps.map((step) => (
                              <li key={step.id} className="flex items-start gap-2 text-sm">
                                <span className={step.ok ? 'text-green-400' : 'text-red-400'}>
                                  {step.ok ? '✓' : '✗'}
                                </span>
                                <span className="text-gray-300">
                                  {step.label}
                                  {step.detail && (
                                    <span className="text-gray-500"> — {step.detail}</span>
                                  )}
                                </span>
                              </li>
                            ))}
                            <li
                              className={`text-sm font-medium ${
                                result.success ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {result.success
                                ? 'Device is ready — now pair it above.'
                                : 'Setup did not finish. Fix the failing step and try again.'}
                            </li>
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col items-center bg-gray-800 p-8 rounded-lg shadow-lg border border-green-500/20 transition-shadow hover:shadow-green-500/20 hover:shadow-xl">
          <p className="text-lg text-gray-300">Support the development of deskthing</p>
          <SponsorButton />
          <p className="text-gray-400 italic">Your support helps keep this project alive</p>
        </div>
      </div>
    </div>
  )
}

export default BluetoothPage

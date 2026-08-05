import { FC, useCallback, useEffect, useState } from 'react'
import { BluetoothBridgeStatus, BluetoothPreference, BluetoothTransport } from '@shared/types'

/**
 * Shows which transport is actually carrying data to the Car Thing, and lets the
 * user pin a preference.
 *
 * Status comes from the main process over IPC; the bluetooth service there owns
 * the bridge helper, the RFCOMM link, and the USB `adb reverse` arbitration. If
 * the platform has no bridge or the helper isn't running, this section hides
 * itself so a plain USB setup looks no different than before.
 */

const POLL_MS = 4000

const TRANSPORT_LABEL: Record<BluetoothTransport, string> = {
  bluetooth: 'Bluetooth',
  usb: 'USB Cable',
  none: 'Not Connected'
}

const TRANSPORT_COLOR: Record<BluetoothTransport, string> = {
  bluetooth: 'text-sky-400',
  usb: 'text-amber-400',
  none: 'text-zinc-500'
}

export const TransportSelector: FC = () => {
  const [status, setStatus] = useState<BluetoothBridgeStatus | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setStatus(await window.electron.bluetooth.getStatus())
    } catch {
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const choose = async (preference: BluetoothPreference): Promise<void> => {
    setBusy(true)
    try {
      setStatus(await window.electron.bluetooth.setPreference(preference))
    } catch {
      setStatus(null)
    } finally {
      setBusy(false)
    }
  }

  if (!status || !status.supported || !status.running) return null

  const active = status.transport

  return (
    <section className="bg-zinc-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-sky-400">📶</span>
        Connection Type
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-zinc-700">
          <span className="text-zinc-400">Carrying Data</span>
          <span className={`font-medium flex items-center gap-2 ${TRANSPORT_COLOR[active]}`}>
            <span
              className={`h-2 w-2 rounded-full ${
                active === 'none' ? 'bg-zinc-600' : 'bg-current animate-pulse'
              }`}
            />
            {TRANSPORT_LABEL[active]}
          </span>
        </div>

        <div className="py-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400">Prefer</span>
            {status.preference === 'bluetooth' && (
              <span className="text-xs text-zinc-500">recommended</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['bluetooth', 'usb'] as BluetoothPreference[]).map((option) => {
              const selected = status.preference === option
              return (
                <button
                  key={option}
                  disabled={busy}
                  onClick={() => choose(option)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    selected
                      ? 'bg-sky-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {option === 'bluetooth' ? 'Bluetooth' : 'USB Cable'}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {status.preference === 'bluetooth'
              ? 'Bluetooth is used whenever it is available, falling back to USB automatically.'
              : 'Pinned to the USB cable. Bluetooth stays disconnected until you switch back.'}
          </p>
        </div>
      </div>
    </section>
  )
}

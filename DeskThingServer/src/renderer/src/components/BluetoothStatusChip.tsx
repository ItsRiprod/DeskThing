import { FC, useEffect, useState } from 'react'
import { IconBluetooth } from '@renderer/assets/icons'
import { BluetoothBridgeStatus } from '@shared/types'

const POLL_MS = 5000

/**
 * Always-visible transport indicator for the top bar. When a Car Thing is
 * carrying data over Bluetooth this is the unmistakable signal; when the
 * platform has no bridge (or nothing is paired yet) it renders nothing so
 * non-Bluetooth setups look unchanged.
 */
export const BluetoothStatusChip: FC = () => {
  const [status, setStatus] = useState<BluetoothBridgeStatus | null>(null)

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

  if (!status?.supported || !status.running) return null
  // Nothing paired yet: stay out of the way until Bluetooth matters.
  if (!status.deviceAddress && !status.linkUp) return null

  const live = status.linkUp && status.transport === 'bluetooth'

  return (
    <div
      title={
        live
          ? 'Car Thing connected over Bluetooth'
          : 'Bluetooth device paired but not connected — it may be off or out of range'
      }
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 mr-2 border ${
        live ? 'border-sky-500 text-sky-400' : 'border-neutral-700 text-neutral-500'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-sky-400 animate-pulse' : 'bg-neutral-600'}`}
      />
      <IconBluetooth iconSize={16} />
      <span className="text-xs font-semibold hidden md:inline">
        {live ? 'Bluetooth' : 'BT idle'}
      </span>
    </div>
  )
}

export default BluetoothStatusChip

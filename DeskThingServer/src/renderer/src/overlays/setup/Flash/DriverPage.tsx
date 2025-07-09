import { FC, useEffect, useState } from 'react'
import { SuperbirdPageProps } from './SuperbirdPage'
import { IconCarThing, IconGear, IconLoading } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { LogEntry } from '@renderer/components/LogEntry'
import { ProgressChannel } from '@shared/types'
import useFlashStore from '@renderer/stores/flashStore'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { useProgressStore } from '@renderer/stores/progressStore'

export const DriverPage: FC<SuperbirdPageProps> = ({ onComplete }) => {
  const [manualOverride, setManualOverride] = useState(false)
  const [loading, setLoading] = useState(false)

  const runDriver = useFlashStore((state) => state.runDriver)
  const progress = useChannelProgress(ProgressChannel.ST_FLASH_DRIVER)
  const resetProgress = useProgressStore((state) => state.clearProgress)

  useEffect(() => {
    return () => {
      resetProgress(ProgressChannel.ST_FLASH_DRIVER)
    }
  }, [])

  const handleConfigureDriver = async (): Promise<void> => {
    setLoading(true)
    await runDriver()
    setLoading(false)
    onComplete('Device Configured Automatically')
  }

  const handleManualOverride = (): void => {
    setManualOverride(true)
    onComplete('Device Configured Manually')
  }

  const isComplete = progress.progress?.progress === 100 || manualOverride

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-lg p-4">
        <div className="w-full py-2 flex items-center justify-center">
          <h1 className="text-xl font-semibold text-white mb-2">Driver Configuration</h1>
        </div>
        <div className="">
          <div className="flex flex-col items-center gap-4">
            <IconCarThing
              highlighted={['Digit1', 'Digit4']}
              highlightColor="#22c55e"
              className="w-96 h-72 -my-16 text-neutral-300"
              text="Press 1 & 4"
            />
            <div className="text-center flex flex-col gap-2 text-sm text-zinc-400">
              <p>1. Press and hold buttons 1 and 4 while plugging in your device</p>
              <p>2. Run Configure Driver below OR manually run:</p>
              <code className="bg-zinc-800 px-2 py-1 rounded">
                irm https://driver.terbium.app/get | iex
              </code>
              <div className="text-xs bg-neutral-950 rounded p-3 flex flex-col items-start">
                <p className="italic">
                  NOTE: You only need to run the driver configuration ONCE per computer
                </p>
                <p className="italic">
                  NOTE: You need to enter &quot;burn mode&quot; (holding buttons 1&4) after every
                  failed attempt to re-enter flashing state
                </p>
                <p className="italic">
                  NOTE: &quot;burn mode&quot; is successfully entered if the screen on the device
                  remains BLACK or states Burn Mode Active
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConfigureDriver}
                className="disabled:bg-emerald-800 disabled:shadow-sm disabled:font-normal disabled:text-neutral-400 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
                disabled={loading}
              >
                {progress.isLoading ? (
                  <IconLoading className="w-5 h-5 mr-2" strokeWidth={1.5} />
                ) : (
                  <IconGear />
                )}
                Configure Driver
              </Button>
              <Button
                onClick={handleManualOverride}
                className="bg-zinc-700 disabled:bg-zinc-800 disabled:font-normal disabled:text-neutral-400 hover:bg-zinc-500 text-neutral-300 hover:text-neutral-200 px-4 py-2 rounded-md transition-all duration-200"
                disabled={loading}
              >
                Force Completion
              </Button>
            </div>
          </div>
          {progress.progress && progress.isLoading && (
            <div className="flex w-full mt-4">
              <LogEntry progressEvent={progress.progress} className="w-full" />
            </div>
          )}
          {isComplete && (
            <div className="mt-4 text-center text-green-500">Driver configuration complete!</div>
          )}
        </div>
      </div>
    </div>
  )
}

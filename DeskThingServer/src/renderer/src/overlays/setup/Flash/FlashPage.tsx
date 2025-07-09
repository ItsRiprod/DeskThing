import { FC, useMemo } from 'react'
import { SuperbirdPageProps } from './SuperbirdPage'
import useFlashStore from '@renderer/stores/flashStore'
import Button from '@renderer/components/Button'
import { IconLink, IconReload, IconStop } from '@renderer/assets/icons'
import usePlatformStore from '@renderer/stores/platformStore'
import { useSearchParams } from 'react-router-dom'

export const FlashPage: FC<SuperbirdPageProps> = ({ onComplete }) => {
  const startFlash = useFlashStore((state) => state.startFlash)
  const flashEvent = useFlashStore((state) => state.flashEvent)
  const cancelFlash = useFlashStore((state) => state.cancelFlash)
  const [searchParams, setSearchParams] = useSearchParams()
  const refreshADB = usePlatformStore((state) => state.refreshADB)

  const calculatedProgress = useMemo(() => {
    if (!flashEvent?.stepTotal || !flashEvent?.step) return 0

    const { step, progress, stepTotal } = flashEvent

    // Calculate progress from completed steps
    const completedStepsProgress = ((step - 1) / stepTotal) * 100

    // Calculate progress from current step
    const currentStepProgress = (progress?.percent || 1) / stepTotal

    // Combine for total progress
    const totalProgress = completedStepsProgress + currentStepProgress

    // Ensure it's within bounds
    return Math.min(Math.max(totalProgress, 0), 100)
  }, [flashEvent])

  const handleComplete = async (): Promise<void> => {
    await startFlash()
    onComplete('Flash Complete')
  }

  const handleCancel = async (): Promise<void> => {
    await cancelFlash()
    onComplete('Flash Cancelled')
  }

  const formatTime = (seconds?: number): string => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatRate = (rate?: number): string => {
    if (!rate) return '0 KB/s'
    return `${(rate / 1024).toFixed(2)} KB/s`
  }

  const gotoClientPage = (): void => {
    searchParams.delete('setup')
    setSearchParams(searchParams)
    refreshADB()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-lg p-4">
        <div className="w-full py-2 flex items-center justify-center">
          <h1 className="text-xl font-semibold text-white mb-2">Flash Firmware</h1>
        </div>

        {flashEvent ? (
          <div className="mt-4 space-y-4">
            <div className="w-full bg-zinc-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  flashEvent.state === 'cancelled'
                    ? 'bg-red-600'
                    : flashEvent.state === 'completed'
                      ? 'bg-emerald-600'
                      : flashEvent.state === 'progress'
                        ? 'bg-blue-500'
                        : ''
                }`}
                style={{ width: `${calculatedProgress || 0}%` }}
              ></div>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  flashEvent.state === 'cancelled'
                    ? 'bg-red-600'
                    : flashEvent.state === 'completed'
                      ? 'bg-emerald-600'
                      : flashEvent.state === 'progress'
                        ? 'bg-yellow-500'
                        : ''
                }`}
                style={{ width: `${flashEvent.progress.percent || 0}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-zinc-400">
              <span>
                Step: ({flashEvent.step}/{flashEvent.stepTotal})
              </span>
              <span>Rate: {formatRate(flashEvent.progress.rate)}</span>
              <span>ETA: {formatTime(flashEvent.progress.etaS)}</span>
              <span>Elapsed: {formatTime(flashEvent.progress.elapsedS)}</span>
            </div>
            {flashEvent.state === 'error' ? (
              <div className="space-y-2 mt-4">
                <div className="bg-red-500/20 border border-red-500 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-500">Error</h3>
                  <p className="text-sm text-red-400 mt-1">{flashEvent.errorText}</p>
                  {flashEvent.suggestion && (
                    <p className="text-sm text-red-400 mt-2">Suggestion: {flashEvent.suggestion}</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleComplete}
                      className="bg-neutral-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
                    >
                      Try Again
                      <IconReload className="ml-2" />
                    </Button>
                    <Button
                      onClick={handleCancel}
                      className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
                    >
                      <IconStop className="mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : flashEvent.state === 'cancelled' ? (
              <div className="space-y-2 mt-4">
                <div className="bg-red-500/20 border border-red-500 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-500">Flash Cancelled</h3>
                  <p className="text-sm text-red-400 mt-1">
                    The flash process was cancelled. Would you like to try again?
                  </p>
                  <p className="text-sm text-red-400 mt-1">
                    You&apos;ll need to unplug and plug in your device again
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleComplete}
                      className="bg-neutral-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
                    >
                      Try Again
                      <IconReload className="ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : flashEvent.state === 'completed' ? (
              <div className="space-y-2 mt-4">
                <div className="bg-emerald-500/20 border border-emerald-500 rounded-md p-4">
                  <h3 className="text-sm font-medium text-emerald-500">Flash Completed</h3>
                  <p className="text-sm text-emerald-400 mt-1">
                    The flash process has completed successfully!
                  </p>
                  <div className="border-l border-emerald-400 pl-5 my-4">
                    <p className="text-sm text-emerald-400 mt-1">What next?</p>
                    <p className="text-sm text-emerald-400 mt-1">
                      It is now safe to unplug and plug in your device. Go to the Clients page, hit
                      Refresh, then hit Configure next to your new DeskThing!
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleComplete}
                      className="bg-neutral-600 hover:bg-orange-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200"
                    >
                      Flash Again?
                      <IconReload className="ml-2" />
                    </Button>
                    <Button
                      onClick={gotoClientPage}
                      className="bg-neutral-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
                    >
                      Go to Clients page
                      <IconLink className="ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                <div className="space-y-1 flex flex-col-reverse">
                  {flashEvent?.pastTitles ? (
                    flashEvent.pastTitles.map((step, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-neutral-300">{step}</span>
                        {step === flashEvent.stepTitle ? (
                          <span className="text-yellow-500">
                            {flashEvent.progress.percent?.toPrecision(4) || 0}%
                          </span>
                        ) : (
                          <span className="text-emerald-500">Complete</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-300">Waiting on response...</span>
                      <span className="text-orange-500">Pending</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={handleCancel}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
                  >
                    <IconStop className="mr-2" />
                    Cancel Flash
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
            >
              Start Flash
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

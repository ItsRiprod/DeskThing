import { FC, useEffect, useState } from 'react'
import {
  IconCarThing,
  IconCarThingSmall,
  IconConfig,
  IconDownload,
  IconGear,
  IconLoading
} from '@renderer/assets/icons'
import Button from '@renderer/components/buttons/Button'
import { LogEntry } from '@renderer/components/LogEntry'
import { ProgressChannel } from '@shared/types'
import useFlashStore from '@renderer/stores/flashStore'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { useProgressStore } from '@renderer/stores/progressStore'
import { usePageStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'

export const AutoConfig: FC = () => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [autoConfigState, setAutoConfigState] = useState<'input' | 'completed' | 'error' | null>(
    null
  )
  const setPage = usePageStore((state) => state.setPage)
  const [searchParams, setSearchParams] = useSearchParams()
  const [errorText, setErrorText] = useState('')
  const [resolutionSteps, setResolutionSteps] = useState<string[]>([])
  const [currentResolutionStep, setCurrentResolutionStep] = useState(0)

  const runAutoConfig = useFlashStore((state) => state.runAutoConfig)
  const progress = useChannelProgress(ProgressChannel.IPC_DEVICES)
  const resetProgress = useProgressStore((state) => state.clearProgress)

  useEffect(() => {
    return () => {
      resetProgress(ProgressChannel.IPC_DEVICES)
    }
  }, [])

  const handleAutoConfig = async (): Promise<void> => {
    setLoading(true)
    const result = await runAutoConfig(step)
    if (result.state === 'input') {
      setAutoConfigState('input')
      setStep(result.nextStep)
      setTimeout(() => {
        setLoading(false)
      }, 3000)
    } else if (result.state === 'completed') {
      setLoading(false)
      setAutoConfigState('completed')
      setStep((prev) => prev + 1)
    } else if (result.state === 'error') {
      setAutoConfigState('error')
      setErrorText(result.errorText)
      setResolutionSteps(result.resolutionSteps)
      setCurrentResolutionStep(0)
      setLoading(false)
    }
  }

  const handleNextResolutionStep = (): void => {
    if (currentResolutionStep < resolutionSteps.length - 1) {
      setCurrentResolutionStep((prev) => prev + 1)
    }
  }

  const tryAgain = (): void => {
    setStep(0)
    setResolutionSteps([])
    setCurrentResolutionStep(0)
    setAutoConfigState(null)
  }

  const navigateToPage = (page: string): void => {
    searchParams.delete('setup')
    setSearchParams(searchParams)
    setPage(page)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-lg p-4">
        <div className="flex flex-col items-center gap-4">
          {step === 0 ? (
            <>
              <IconCarThing
                highlighted={['Digit1', 'Digit4']}
                highlightColor="#22c55e"
                className="w-96 h-72 -my-16 text-neutral-300"
                text="Press 1 & 4"
              />
              <div className="text-center flex flex-col gap-2 text-sm text-zinc-400">
                <p>1. Press and hold buttons 1 and 4 while plugging in your device</p>
                <p>2. Wait for the device to enter burn mode (screen should be BLACK)</p>
                <p className="italic">
                  NOTE: &quot;burn mode&quot; is successfully entered if the screen remains BLACK
                </p>
              </div>
              <Button
                onClick={() => setStep(1)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
              >
                I&apos;m Ready - Continue to Auto Configuration
              </Button>
            </>
          ) : step === 1 ? (
            <>
              <div className="text-center flex flex-col gap-2 text-sm text-zinc-400">
                <p>Click Start Auto Configure below to begin the process</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAutoConfig}
                  className="disabled:bg-emerald-800 disabled:shadow-sm disabled:font-normal disabled:text-neutral-400 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
                  disabled={loading || progress.isLoading}
                >
                  {progress.isLoading ? (
                    <IconLoading className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  ) : (
                    <IconGear />
                  )}
                  Start Auto Configure
                </Button>
              </div>
            </>
          ) : step === 2 ? (
            <div className="flex flex-col gap-4 items-center justify-center">
              <div className="text-center text-zinc-400">
                <p>Success! Now unplug and plug in the device before continuing...</p>
              </div>
              <Button
                onClick={handleAutoConfig}
                className="disabled:bg-emerald-800 disabled:shadow-sm disabled:font-normal disabled:text-neutral-400 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
                disabled={loading || progress.isLoading}
              >
                {progress.isLoading ? (
                  <IconLoading className="w-5 h-5 mr-2" strokeWidth={1.5} />
                ) : (
                  <IconConfig className="mr-2" />
                )}
                <p>Begin Client Configuration</p>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-emerald-500">
                  Congrats! Your device has been fully setup
                </h1>
                <p className="text-zinc-400">Now you can configure it or install some apps</p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => navigateToPage('downloads/app')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 flex items-center gap-2"
                >
                  <IconDownload />
                  <p>Install Apps</p>
                </Button>
                <Button
                  onClick={() => navigateToPage('clients/connections')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 flex items-center gap-2"
                >
                  <IconCarThingSmall />
                  <p>View Devices</p>
                </Button>
              </div>
            </div>
          )}

          {autoConfigState === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center text-red-500">
                <p>{errorText}</p>
              </div>
              <div className="text-center flex flex-col items-center text-zinc-400">
                <p>
                  Resolution Step {currentResolutionStep + 1} of {resolutionSteps.length}:
                </p>
                <p>{resolutionSteps[currentResolutionStep]}</p>
                {currentResolutionStep < resolutionSteps.length - 1 && (
                  <Button
                    onClick={handleNextResolutionStep}
                    className="mt-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md"
                  >
                    I&apos;ve tried this - Next Step
                  </Button>
                )}
                {currentResolutionStep === resolutionSteps.length - 1 && (
                  <Button
                    onClick={tryAgain}
                    className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        {progress.progress && progress.isLoading && (
          <div className="flex w-full mt-4">
            <LogEntry allowExpanding progressEvent={progress.progress} className="w-full" />
          </div>
        )}
      </div>
    </div>
  )
}

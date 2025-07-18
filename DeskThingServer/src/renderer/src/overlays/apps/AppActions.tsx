import React, { useCallback, useEffect, useState } from 'react'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import {
  IconDownload,
  IconLoading,
  IconPlay,
  IconStop,
  IconTrash,
  IconX
} from '@renderer/assets/icons'
import useMappingStore from '@renderer/stores/mappingStore'
import { Action } from '@deskthing/types'
import ActionElement from '@renderer/components/ActionElement'
import { useAppStore } from '@renderer/stores'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { ProgressChannel } from '@shared/types'
import { LogEntry } from '@renderer/components/LogEntry'

const AppActions: React.FC<AppSettingProps> = ({ app, onClose }: AppSettingProps) => {
  const actions = useMappingStore((state) => state.actions)
  const fetchActions = useMappingStore((state) => state.getActions)
  const { purgeApp, enableApp, disableApp, runApp, stopApp, runPostinstall } = useAppStore(
    (state) => state
  )

  const [availableActions, setAvailableActions] = useState<Action[]>([])
  const [loading, setIsLoading] = useState(false)

  const downloadChannel = useChannelProgress(ProgressChannel.IPC_APPS)

  useEffect(() => {
    setAvailableActions(actions.filter((action) => action.source === app.name))
  }, [actions])

  useEffect(() => {
    fetchActions()
  }, [])

  const purge = async (appName: string): Promise<boolean> => {
    onClose()
    return await purgeApp(appName)
  }

  const withLoading = useCallback((fn: (appName: string) => Promise<boolean>) => {
    return async () => {
      setIsLoading(true)
      try {
        await fn(app.name)
      } finally {
        setIsLoading(false)
      }
    }
  }, [])

  const handlePurge = withLoading(purge)
  const handlePostinstall = withLoading(runPostinstall)
  const handleEnable = withLoading(enableApp)
  const handleDisable = withLoading(disableApp)
  const handleRun = withLoading(runApp)
  const handleStop = withLoading(stopApp)

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex p-4 w-full gap-5">
        <Button
          onClick={handlePurge}
          disabled={loading}
          title="Purges and deletes the app"
          className="justify-center disabled:text-gray-300 gap-2 enabled:hover:bg-red-500 border-red-500 border w-full"
        >
          <IconTrash className="stroke-2" />
          <p className="md:block hidden">Uninstall</p>
        </Button>

        {app.enabled ? (
          <Button
            onClick={handleDisable}
            title="Disables the app - preventing it from running on startup"
            disabled={loading}
            className="justify-center gap-2 disabled:text-gray-300 enabled:hover:bg-red-500 border-red-500 border w-full"
          >
            <IconStop className="stroke-2" />
            <p className="md:block hidden">Disable</p>
          </Button>
        ) : (
          <Button
            onClick={handleEnable}
            title="Enables the app"
            disabled={loading}
            className="justify-center gap-2 disabled:text-gray-300 border enabled:hover:bg-green-500 border-green-500 w-full"
          >
            <IconPlay className="stroke-2" />
            <p className="md:block hidden">Enable</p>
          </Button>
        )}
        {app.running ? (
          <Button
            onClick={handleStop}
            title="Stops the app"
            disabled={loading}
            className="justify-center gap-2 disabled:text-gray-300 enabled:hover:bg-red-500 border-red-500 border w-full"
          >
            <IconX className="stroke-2" />
            <p className="md:block hidden">Stop</p>
          </Button>
        ) : (
          <Button
            onClick={handleRun}
            title="Runs the app"
            className={`justify-center gap-2 disabled:text-gray-300 border ${app.enabled ? 'hover:bg-cyan-500 border-cyan-500' : 'hover:bg-cyan-950 border-cyan-900'} w-full`}
            disabled={!app.enabled || loading}
          >
            <IconPlay className="stroke-2" />
            <p className="md:block hidden">Run</p>
          </Button>
        )}
      </div>
      <div className="text-xs text-gray-500 px-4 font-geistMono">
        <h1>
          {app.manifest?.label || app.name} is {app.running ? 'running' : 'not running'}
        </h1>
        <h1>App will {app.enabled ? 'Start Automatically' : 'Not Start Automatically'}</h1>
      </div>
      <div className="flex flex-wrap gap-2 p-4 justify-start">
        {app.manifest?.postinstall && (
          <div className="flex gap-2 border-cyan-500 border rounded-md">
            <Button
              disabled={loading}
              onClick={handlePostinstall}
              className="group gap-2 justify-center items-center hover:bg-cyan-500"
            >
              <IconDownload className="group-disabled:hidden stroke-2" />
              <IconLoading className="group-enabled:hidden stroke-2" />
              <p>Run Postinstall Script</p>
            </Button>
          </div>
        )}
        {availableActions.map((action) => (
          <ActionElement key={action.id} action={action} />
        ))}
      </div>
      <div className="absolute w-full bottom-0">
        {loading && downloadChannel.progress && (
          <LogEntry progressEvent={downloadChannel.progress} />
        )}
      </div>
    </div>
  )
}

export default AppActions

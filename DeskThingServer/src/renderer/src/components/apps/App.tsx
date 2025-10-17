/**
 * Renders an App component that displays information about an application, including its name, version, and whether it is running or stopped. The component also provides buttons to start, stop, or view the details of the application.
 *
 * @param app - An object containing information about the application, including its name, manifest, and running state.
 * @param activeRequest - A boolean indicating whether the application has an active request.
 * @returns A React component that renders the App UI.
 */
import React from 'react'
import { App as AppType } from '@deskthing/types'
import { IconGrip, IconPause, IconPlay, IconPulsing, IconWrench } from '@renderer/assets/icons'
import Button from '../buttons/Button'
import { useAppStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'
import { AppIcon } from './AppIcon'
import { AppRoleTags } from './AppRoleTags'
import AppActionTags from './AppActionTags'

interface AppProps {
  app: AppType
  activeRequest?: boolean
}

const App: React.FC<AppProps> = ({ app, activeRequest }) => {
  const stopApp = useAppStore((appStore) => appStore.stopApp)
  const runApp = useAppStore((appStore) => appStore.runApp)
  const [searchParams, setSearchParams] = useSearchParams()

  const showAppDetails = (): void => {
    searchParams.set('app', 'true')
    searchParams.set('appId', app.name)
    if (app.meta?.updateAvailable) searchParams.set('page', 'update')
    setSearchParams(searchParams)
  }

  const showAppRequests = (): void => {
    searchParams.set('notifications', 'true')
    searchParams.set('page', 'request')
    setSearchParams(searchParams)
  }

  return (
    <div className="flex items-center bg-zinc-950 border-neutral-900 border p-4 justify-between rounded-xl text-neutral-200">
      <div className="flex items-center gap-4">
        <IconGrip className="text-gray-300 -mx-3 cursor-grab md:block hidden" />
        <div className="w-12 h-12 flex-shrink-0">
          <AppIcon className="w-full h-full text-neutral-200 fill-neutral-200" appId={app.name} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-geist font-semibold">{app.manifest?.label || app.name}</h2>
            {app.manifest?.version && (
              <p className="text-xs text-gray-500 font-geistMono italic">{app.manifest.version}</p>
            )}
          </div>

          <div className="font-geistMono text-xs flex gap-2 text-gray-300">
            <AppRoleTags appId={app.name} />
            <AppActionTags appId={app.name} />
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <p className="font-geistMono italic">By {app.manifest?.author || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex md:items-center items-end gap-3 md:flex-row flex-col">
        {activeRequest && (
          <Button
            title="Handle data request"
            className="bg-cyan-950 border-cyan-900 border hover:bg-cyan-600 items-center justify-center gap-1 sm:gap-2 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-lg hover:shadow-cyan-500/20 transition-all duration-200"
            onClick={showAppRequests}
          >
            <IconPulsing />
            <p className="text-xs hidden md:block lg:text-base font-medium text-nowrap">
              Requesting Data
            </p>
          </Button>
        )}

        <Button
          title="App Settings"
          onClick={showAppDetails}
          className={`bg-slate-950 hover:bg-slate-800 items-center justify-center gap-1 sm:gap-2 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-lg hover:shadow-slate-800/20 transition-all duration-200 ${app.meta?.updateAvailable ? 'border md:border-0 border-emerald-500 hover:bg-emerald-600' : 'border border-slate-900'}`}
        >
          {app.meta?.updateAvailable ? (
            <div className="flex gap-2 items-center">
              <IconWrench className="text-gray-300 md:hidden" />
              <div className="hidden md:block animate-pulse w-2 h-4 bg-emerald-500 rounded-full" />
              <p className="text-xs hidden md:block text-white lg:text-base font-medium">
                Update Available
              </p>
            </div>
          ) : (
            <div className="flex gap-1 sm:gap-2 items-center justify-center">
              <IconWrench className="text-gray-300" />
              <p className="text-xs hidden md:block lg:text-base font-medium">Settings</p>
            </div>
          )}
        </Button>
        {app.running ? (
          <Button
            title="Pause App"
            className="bg-amber-950 border border-amber-900 hover:bg-amber-500 items-center justify-center gap-1 sm:gap-2 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
            onClick={() => stopApp(app.name)}
          >
            <p className="text-xs hidden md:block lg:text-base font-medium">Pause</p>
            <IconPause className="stroke-2" />
          </Button>
        ) : (
          <Button
            title="Run App"
            className="bg-cyan-950 border-cyan-900 border hover:bg-cyan-600 items-center justify-center gap-1 sm:gap-2 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-lg hover:shadow-cyan-500/20 transition-all duration-200"
            onClick={() => runApp(app.name)}
          >
            <p className="text-xs hidden md:block lg:text-base font-medium">Run</p>
            <IconPlay className="stroke-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default App

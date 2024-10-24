import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/'
import { App, AppDataInterface } from '@shared/types'
import Button from '@renderer/components/Button'
import { IconX } from '@renderer/assets/icons'
import Overlay from './Overlay'

interface AppSettingsOverlayProps {
  onClose: () => void
  app: App
}

const AppSettingsOverlay: React.FC<AppSettingsOverlayProps> = ({ onClose, app }) => {
  const getAppData = useAppStore((appStore) => appStore.getAppData)
  //const setAppData = useAppStore((appStore) => appStore.setAppData)
  const [appData, setAppDataState] = useState<AppDataInterface>({})

  useEffect(() => {
    const fetchAppData = async (): Promise<void> => {
      const data = await getAppData(app.name)

      // If there is no data, dont add it
      if (!data) return

      console.log(data)
      setAppDataState(data)
    }
    fetchAppData()
  }, [getAppData, app.name])

  const handlePurge = (): void => {
    window.electron.purgeApp(app.name)
  }

  if (!app.manifest) return

  return (
    <Overlay
      onClose={onClose}
      className="border border-gray-500 p-4 bg-zinc-900 w-5/6 h-5/6 flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl font-semibold">{app.manifest.label}</h2>
          <h2 className="text-xl font-semibold">{app.manifest.version}</h2>
        </div>
        <p className="italic text-gray-400 font-geistMono">{app.name}</p>
        <Button onClick={handlePurge}>
          <IconX />
        </Button>
        <div className="w-full border bg-black shadow-2xl border-gray-500 rounded-2xl p-5">
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Is Audio Source:</p>
              <p>{app.manifest.isAudioSource ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-semibold">Requires:</p>
              <ul className="list-disc list-inside">
                {app.manifest.requires.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Description:</p>
              <p>{app.manifest.description || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Author:</p>
              <p>{app.manifest.author || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">ID:</p>
              <p>{app.manifest.id}</p>
            </div>
            <div>
              <p className="font-semibold">Is Web App:</p>
              <p>{app.manifest.isWebApp ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-semibold">Is Screen Saver:</p>
              <p>{app.manifest.isScreenSaver ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-semibold">Is Local App:</p>
              <p>{app.manifest.isLocalApp ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-semibold">Platforms:</p>
              <ul className="list-disc list-inside">
                {app.manifest.platforms.map((platform, index) => (
                  <li key={index}>{platform}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Homepage:</p>
              {app.manifest.homepage && (
                <a href={app.manifest.homepage} target="_blank" rel="noreferrer noopener">
                  {app.manifest.homepage || 'N/A'}
                </a>
              )}
            </div>
            <div>
              <p className="font-semibold">Repository:</p>
              {app.manifest.repository && (
                <a href={app.manifest.repository} target="_blank" rel="noreferrer noopener">
                  {app.manifest.repository || 'N/A'}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="w-full border bg-black shadow-2xl border-gray-500 rounded-2xl p-5">
          <h1 className="font-semibold pb-5 text-center w-full text-xl">Settings</h1>
          <div>
            {appData.settings &&
              Object.values(appData.settings).map((setting, index) => (
                <div key={index}>
                  <p className="font-semibold">{setting.label}</p>
                  <p>{setting.value.toString()}</p>
                </div>
              ))}
          </div>
        </div>
        <div className="w-full border bg-black shadow-2xl border-gray-500 rounded-2xl p-5">
          <h1 className="font-semibold pb-5 text-center w-full text-xl">Data</h1>
          {appData ? (
            <div className="grid lg:grid-cols-2 gap-4">
              {Object.entries(appData).map(([key, value], index) => (
                <div key={index}>
                  {key !== 'settings' && (
                    <>
                      <p className="font-semibold">{key}</p>
                      {Array.isArray(value) ? (
                        <ul className="list-disc list-inside">
                          {value.map((item, i) => (
                            <li key={i}>
                              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                            </li>
                          ))}
                        </ul>
                      ) : typeof value === 'object' ? (
                        <pre>{JSON.stringify(value, null, 2)}</pre>
                      ) : (
                        <p>{String(value)}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex">
              <p>No app data available</p>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}

export default AppSettingsOverlay

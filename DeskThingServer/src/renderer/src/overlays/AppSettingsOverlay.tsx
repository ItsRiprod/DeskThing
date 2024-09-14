import React, { useEffect, useState } from 'react'
import { IconRefresh, IconSave, IconX } from '../assets/icons'
import { AppData } from '@renderer/store'

interface AppSettingsOverlayProps {
  appIndex: number
  setEnabled: (boolean) => void
  data: AppData
}

export interface Settings {
  [key: string]: {
    value: string | boolean
    label: string
    options: {
      label: string
      value: string | boolean
    }[]
  }
}

type AppSettingData = {
  [key: string]: string | Settings | undefined
  settings?: Settings
}

const AppSettingsOverlay: React.FC<AppSettingsOverlayProps> = ({ appIndex, setEnabled, data }) => {
  const currentApp = data ? data.apps[appIndex].name : null
  const [appData, setAppData] = useState<AppSettingData>({})
  const [visibleOptions, setVisibleOptions] = useState<string>()
  const fetchSettings = async (): Promise<void> => {
    if (currentApp) {
      const currentData = await window.electron.getAppData(currentApp)
      setAppData(currentData)
      console.log('Current Data: ', currentData)
    }
  }
  useEffect(() => {
    // Fetch current settings from electron store
    fetchSettings()
  }, [])
  const handleUpload = async (): Promise<void> => {
    //const updatedManifest = { ...manifest, ip, port }
    if (currentApp) {
      await window.electron.saveAppData(currentApp, appData)
    }
    setEnabled(false)
  }

  const saveSettings = async (settingKey: string, value: string | boolean): Promise<void> => {
    if (currentApp && appData.settings && appData.settings[settingKey]) {
      const setting = {
        id: settingKey,
        value: value
      }
      await window.electron.saveAppSetting(currentApp, setting)
      fetchSettings()
    }
  }

  const handleValueChange = (key: string, value: string): void => {
    setAppData((prevData) => ({
      ...prevData,
      [key]: value
    }))
  }

  const hasValues = Object.values(appData).some((val) => typeof val === 'string')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {data.apps[appIndex]?.manifest?.label || currentApp} Settings
          </h2>
          <button
            onClick={() => setEnabled(false)}
            className="text-gray-400 border-red-600 border p-2 rounded-lg hover hover:bg-red-500 focus:outline-none"
          >
            <IconX />
          </button>
        </div>
        <div className="overflow-y-auto font-geistMono max-h-[80vh]">
          <div className="border-zinc-500 font-geist border p-2 my-2 rounded-xl">
            <h1 className="text-xl p-2 w-full justify-center font-semibold flex">
              Modify Settings
            </h1>
            {appData &&
              appData.settings &&
              Object.entries(appData.settings).map(([key, val], index) => (
                <div
                  key={index}
                  className={`my-2 p-2 ${visibleOptions === key ? 'border-slate-600 border bg-slate-800 rounded-xl' : 'hover:border-slate-600 border-l border-transparent'}`}
                >
                  <button
                    className={`flex flex-wrap justify-between w-full ${visibleOptions != key && 'hover:bg-slate-700'} p-3 rounded-xl`}
                    onClick={() => setVisibleOptions(key)}
                  >
                    <div className="text-justify">
                      <h1 className="font-semibold text-xl">{val.label}</h1>
                      <h1 className="font-geistMono text-xs italic">{key}</h1>
                    </div>
                    <p className="p-5 rounded-xl bg-zinc-500 hover:bg-zinc-400">
                      {typeof val.value === 'boolean' ? (val.value ? 'true' : 'false') : val.value}
                    </p>
                  </button>
                  {visibleOptions == key && (
                    <div className="border border-slate-700 rounded-xl p-5 mt-5">
                      {val.options.map((val, index) => (
                        <button
                          key={index}
                          className="w-full bg-slate-700 my-2 py-2 rounded-full hover:bg-slate-600"
                          onClick={() => saveSettings(key, val.value)}
                        >
                          <p className="font-semibold">{val.label}</p>
                          <p className="font-geistMono italic text-xs">{val.value}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
          {hasValues && (
            <div className="items-center border-zinc-500 border p-2 my-2 rounded-xl">
              <h1 className="text-xl p-2 w-full justify-center font-semibold flex">
                Modify Values
              </h1>
              <div className="mb-4">
                {appData &&
                  Object.entries(appData).map(([key, val], index) => {
                    if (typeof val === 'string') {
                      return (
                        <div key={index} className="flex mt-4 flex-col">
                          <label className="block text-sm" htmlFor={key}>
                            {key}
                          </label>
                          <input
                            type="text"
                            className="border p-2 rounded text-black"
                            value={val}
                            onChange={(e) => handleValueChange(key, e.target.value)}
                          />
                        </div>
                      )
                    } else {
                      return null
                    }
                  })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="border-cyan-600 group flex gap-3 border-2 p-3 rounded-xl hover:bg-cyan-600"
              onClick={fetchSettings}
            >
              <p className="group-hover:block hidden">Reset</p>
              <IconRefresh />
            </button>
            <button
              className="border-green-500 group flex gap-3 border-2 p-3 rounded-xl hover:bg-green-500"
              onClick={handleUpload}
            >
              <p className="group-hover:block hidden">Save</p>
              <IconSave />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppSettingsOverlay

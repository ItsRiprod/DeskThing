import { useState, useEffect } from 'react'
import {
  IconX,
  IconRefresh,
  IconSave,
  IconPlus,
  IconReload,
  IconLogoGearLoading
} from '../assets/icons'
import SettingsStoreInstance, { Settings } from '@renderer/store/settingsStore'
import { LogStore } from '@renderer/store'

interface SettingsOverlayProps {
  setEnabled: (enabled: boolean) => void
}

interface ReplyData {
  status: boolean
  data: string
  final: boolean
  error?: string
}

const SettingsOverlay = ({ setEnabled }: SettingsOverlayProps): JSX.Element => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [newAppRepo, setNewAppRepo] = useState<string>('')
  const [newClientRepo, setNewClientRepo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [firewallOutput, setFirewallOutput] = useState<ReplyData[]>([])

  useEffect(() => {
    // Fetch current settings from electron store
    const fetchSettings = async (): Promise<void> => {
      const currentSettings = await SettingsStoreInstance.getSettings()
      setSettings(currentSettings)
      console.log('Got ', currentSettings)
    }
    fetchSettings()
  }, [])

  const handleSettingChange = (setting: keyof Settings, value: any): void => {
    setSettings(
      (prevSettings) =>
        prevSettings && {
          ...prevSettings,
          [setting]: value
        }
    )
  }

  const handleSave = async (): Promise<void> => {
    if (settings) {
      const socketData = {
        type: 'settings',
        payload: settings,
        app: 'server'
      }
      await SettingsStoreInstance.saveSettings(socketData)
      await SettingsStoreInstance.requestSettings()
      setEnabled(false)
    }
  }

  const handleRefreshFirewall = (): void => {
    window.electron.refreshFirewall()
    setFirewallOutput([])
    console.log('Refreshing firewall')
    const unsubscribe = window.electron.ipcRenderer.on('logging', (_event, reply) => {
      console.log(reply)
      if (reply.final) {
        setLoading(false)
        unsubscribe()
      } else {
        setLoading(true)
      }

      if (!reply.status) {
        setFirewallOutput((data) => [...data, reply])
        unsubscribe()
      } else {
        if (reply.data) {
          setFirewallOutput((data) => [...data, reply])
        }
      }
    })
  }

  const handleReset = async (): Promise<void> => {
    const defaultSettings = await SettingsStoreInstance.requestSettings()
    setSettings(defaultSettings)
  }

  const handleAddRepo = (type: 'app' | 'client'): void => {
    const url = type === 'app' ? newAppRepo : newClientRepo
    if (url && validateURL(url)) {
      handleSettingChange(type === 'app' ? 'appRepos' : 'clientRepos', [
        ...(type === 'app' ? settings?.appRepos : settings?.clientRepos)!,
        url
      ])
      type === 'app' ? setNewAppRepo('') : setNewClientRepo('')
    } else {
      LogStore.addLog('error', `Invalid ${type} repository URL: ${url}`)
    }
  }

  const handleDeleteRepo = (type: 'app' | 'client', index: number): void => {
    const updatedRepos = (type === 'app' ? settings?.appRepos : settings?.clientRepos)!.filter(
      (_, i) => i !== index
    )
    handleSettingChange(type === 'app' ? 'appRepos' : 'clientRepos', updatedRepos)
  }

  const validateURL = (url: string): boolean => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    ) // fragment locator
    return !!pattern.test(url)
  }

  if (!settings) {
    return <div className="fixed left-1/2 top-1/2">Loading...</div>
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 animate-fade p-5 w-11/12 rounded-lg max-h-[90vh] overflow-auto drop-shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Server Settings</h2>
          <button
            onClick={() => setEnabled(false)}
            className="text-gray-400 border-red-600 border p-3 rounded-lg hover:text-white hover:bg-red-500 focus:outline-none"
          >
            <IconX />
          </button>
        </div>
        <div className="p-5 m-1 rounded-lg drop-shadow-lg">
          <h1 className="m-5 font-semibold text-3xl">GENERAL</h1>
          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Auto Start on Boot:</p>
            <div className="group flex items-center">
              <p className="group-hover:block hidden">Run DeskThing when the computer boots</p>
              <input
                type="checkbox"
                checked={settings.autoStart}
                onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
            </div>
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Run App in Background:</p>
            <div className="group flex items-center">
              <p className="group-hover:block hidden">Pending Implementation</p>
              <input
                disabled={true}
                type="checkbox"
                checked={settings.minimizeApp}
                onChange={(e) => handleSettingChange('minimizeApp', e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
            </div>
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Global ADB:</p>
            <div className="group flex items-center">
              <p className="group-hover:block hidden">Use local adb (false) or global adb (true)</p>
              <input
                type="checkbox"
                checked={settings.globalADB}
                onChange={(e) => handleSettingChange('globalADB', e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
            </div>
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl">
            <div className="flex justify-between items-center">
              <p>Firewall Config:</p>
              <div className="group flex items-center">
                <button
                  onClick={handleRefreshFirewall}
                  className={`border rounded-xl p-2 ${loading ? 'border-amber-500 hover:bg-amber-500' : 'border-red-500 hover:bg-red-500'} hover:text-white flex gap-2 hover:font-semibold`}
                  disabled={loading}
                >
                  <p className="group-hover:block hidden">Refresh Firewall</p>
                  {loading ? <IconLogoGearLoading /> : <IconReload />}
                </button>
              </div>
            </div>
            {firewallOutput && (
              <div className="py-2">
                {firewallOutput.map((reply, index) => (
                  <div
                    key={index}
                    className={`font-geistMono border-l-2 pl-1 bg-black/15 border-black ${!reply.status ? 'text-red-500' : reply.final ? 'text-green-500 border-b' : 'text-slate-500'}`}
                  >
                    <p>{reply.data}</p>
                    <p className="italic text-xs">{reply.error}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h1 className="m-5 font-semibold text-3xl">IP / NETWORK</h1>
          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Callback Port:</p>
            <input
              type="number"
              value={settings.callbackPort}
              onChange={(e) => handleSettingChange('callbackPort', Number(e.target.value))}
              className="h-10 bg-slate-500 rounded focus:bg-white active:bg-white focus:text-black active:text-black px-2 text-white-600"
            />
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Device Port:</p>
            <input
              type="number"
              value={settings.devicePort}
              onChange={(e) => handleSettingChange('devicePort', Number(e.target.value))}
              className="h-10 bg-slate-500 rounded focus:bg-white active:bg-white focus:text-black active:text-black px-2 text-white-600"
            />
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Address:</p>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleSettingChange('address', e.target.value)}
              className="h-10 bg-slate-500 rounded focus:bg-white active:bg-white focus:text-black active:text-black px-2 text-white-600"
            />
          </div>
          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex flex-col gap-3">
            {settings?.localIp &&
              settings.localIp.map((ip, index) => (
                <div key={index} className="flex justify-between items-center">
                  <p>Local IP #{index + 1}:</p>
                  <div className="h-10 bg-slate-500 flex items-center rounded px-2 text-gray-300">
                    <p>{ip}</p>
                  </div>
                </div>
              ))}
          </div>

          <h1 className="m-5 font-semibold text-3xl">DOWNLOADS</h1>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex flex-col gap-3">
            <p>Saved App Repos:</p>
            {settings?.appRepos.map((repo, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="h-10 bg-slate-500 flex items-center rounded px-2 text-gray-300">
                  <p>{repo}</p>
                </div>
                <button
                  onClick={() => handleDeleteRepo('app', index)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                >
                  <IconX />
                </button>
              </div>
            ))}
            <div className="flex">
              <input
                type="text"
                value={newAppRepo}
                onChange={(e) => setNewAppRepo(e.target.value)}
                placeholder="Add new app repo"
                className="h-10 bg-slate-500 rounded focus:bg-white active:bg-white focus:text-black active:text-black px-2 text-white-600 flex-grow"
              />
              <button
                onClick={() => handleAddRepo('app')}
                className="text-green-500 hover:text-green-700 focus:outline-none ml-2"
              >
                <IconPlus />
              </button>
            </div>
          </div>

          {/* Saved Client Repos */}
          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex flex-col gap-3">
            <p>Saved Client Repos:</p>
            {settings?.clientRepos.map((repo, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="h-10 bg-slate-500 flex items-center rounded px-2 text-gray-300">
                  <p>{repo}</p>
                </div>
                <button
                  onClick={() => handleDeleteRepo('client', index)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                >
                  <IconX />
                </button>
              </div>
            ))}
            <div className="flex">
              <input
                type="text"
                value={newClientRepo}
                onChange={(e) => setNewClientRepo(e.target.value)}
                placeholder="Add new client repo"
                className="h-10 bg-slate-500 rounded focus:bg-white active:bg-white focus:text-black active:text-black px-2 text-white-600 flex-grow"
              />
              <button
                onClick={() => handleAddRepo('client')}
                className="text-green-500 hover:text-green-700 focus:outline-none ml-2"
              >
                <IconPlus />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-700 p-5 m-1 flex justify-between rounded-lg drop-shadow-lg">
          <button
            className="flex group border-red-600 border hover:bg-red-500 p-3 rounded-lg drop-shadow-lg"
            onClick={() => setEnabled(false)}
          >
            <IconX iconSize={24} />
            <p className="hidden group-hover:block">Exit</p>
          </button>
          <div className="flex gap-4">
            <button
              className="group gap-2 flex border-cyan-600 border hover:bg-cyan-500 p-3 rounded-lg drop-shadow-lg"
              onClick={handleReset}
            >
              <p className="group-hover:block hidden">Reset</p>
              <IconRefresh iconSize={24} />
            </button>
            <button
              className="group gap-2 flex border-green-600 border hover:bg-green-500 p-3 rounded-lg drop-shadow-lg"
              onClick={handleSave}
            >
              <p className="group-hover:block hidden">Save</p>
              <IconSave iconSize={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsOverlay

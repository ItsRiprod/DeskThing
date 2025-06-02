import React, { useState } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import Button from '@renderer/components/Button'
import { IconLoading, IconPlay, IconToggle } from '@renderer/assets/icons'
import { ReplyData, Settings } from '@shared/types'

const DeviceSettings: React.FC = () => {
  const { settings, saveSettings } = useSettingsStore()
  const [firewallOutput, setFirewallOutput] = useState<ReplyData[]>([])
  const [loading, setLoading] = useState(false)

  const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
    saveSettings({ ...settings, [key]: value })
  }

  const handleRefreshFirewall = (): void => {
    window.electron.utility.refreshFirewall()
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

  return (
    <div className="w-full absolute inset h-full divide-y-2 divide-gray-500 p-4 flex flex-col">
      <div className="w-full px-4 flex justify-between items-center">
        <h2 className="text-xl">Auto Detect ADB</h2>
        <Button
          className="bg-transparent p-0"
          onClick={() => handleSettingChange('adb_autoDetect', !settings.adb_autoDetect)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.adb_autoDetect}
            className={`transition-color ${settings.adb_autoDetect ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>

      <div className="w-full px-4 flex justify-between items-center">
        <h2 className="text-xl">Use Global ADB</h2>
        <Button
          className="bg-transparent p-0"
          onClick={() => handleSettingChange('adb_useGlobal', !settings.adb_useGlobal)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.adb_useGlobal}
            className={`transition-color ${settings.adb_useGlobal ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>

      <div className="w-full px-4 flex justify-between items-center">
        <h2 className="text-xl">Auto Config</h2>
        <Button
          className="bg-transparent p-0"
          onClick={() => handleSettingChange('adb_autoConfig', !settings.adb_autoConfig)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.adb_autoConfig}
            className={`transition-color ${settings.adb_autoConfig ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>

      <div className="flex flex-col">
        <div className="w-full px-4 p-3 flex justify-between items-center">
          <h2 className="text-xl">Run Firewall Configuration</h2>
          <Button
            className={`bg-zinc-900 ${!loading && 'hover:bg-zinc-800'}`}
            onClick={handleRefreshFirewall}
            disabled={loading}
          >
            {loading ? <IconLoading /> : <IconPlay />}
          </Button>
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
    </div>
  )
}

export default DeviceSettings

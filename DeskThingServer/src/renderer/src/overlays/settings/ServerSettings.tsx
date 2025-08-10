import React, { useState } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import Button from '@renderer/components/Button'
import { IconLoading, IconPlay, IconSave, IconToggle } from '@renderer/assets/icons'
import Select from '@renderer/components/Select'
import { SingleValue } from 'react-select'
import { SettingOption } from '@deskthing/types'
import { LOG_FILTER, ProgressChannel, Settings } from '@shared/types'
import useUpdateStore from '@renderer/stores/updateStore'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { LogEntry } from '@renderer/components/LogEntry'
import { InfoComponent } from '@renderer/components/InfoComponent'

const ServerSettings: React.FC = () => {
  const initialSettings = useSettingsStore((settings) => settings.settings)
  const saveSettings = useSettingsStore((settings) => settings.saveSettings)
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [updateStatus, setUpdateStatus] = useState('')
  const checkForUpdateFn = useUpdateStore((state) => state.checkForUpdates)

  const firewallProgress = useChannelProgress(ProgressChannel.FIREWALL)

  const handleRefreshFirewall = (): void => {
    window.electron.utility.refreshFirewall()
    console.log('Refreshing firewall')
  }

  const logLevelOptions = [
    { value: LOG_FILTER.DEBUG, label: 'Debug' },
    { value: LOG_FILTER.MESSAGE, label: 'Message' },
    { value: LOG_FILTER.INFO, label: 'Info' },
    { value: LOG_FILTER.WARN, label: 'Warning' },
    { value: LOG_FILTER.ERROR, label: 'Error' },
    { value: LOG_FILTER.FATAL, label: 'Fatal' },
    { value: LOG_FILTER.SILENT, label: 'Silent' }
  ]

  const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = async (): Promise<void> => {
    setLoading(true)
    saveSettings(settings)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  const checkForUpdate = async (): Promise<void> => {
    setDownloadLoading(true)
    setUpdateStatus('')
    const updateStatus = await checkForUpdateFn()
    setTimeout(() => {
      setDownloadLoading(false)
      setUpdateStatus(updateStatus)
    }, 1000)
  }

  return (
    <div className="w-full text-neutral-200 absolute inset h-full p-4 flex flex-col divide-y divide-neutral-800">
      <div className="w-full px-4 p-3 flex flex-col justify-between items-center">
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-1">
            <h2 className="text-xl">Check for updates</h2>
            <InfoComponent description="Checks for server updates" side="bottom" />
          </div>
          <Button
            title="Manually check for updates to the system"
            className={`bg-zinc-900 ${!downloadLoading && 'hover:bg-green-500'}`}
            onClick={checkForUpdate}
            disabled={downloadLoading}
          >
            {downloadLoading ? <IconLoading /> : <IconPlay />}
          </Button>
        </div>
        {updateStatus && (
          <div className="w-full pt-3 flex justify-between items-center">{updateStatus}</div>
        )}
      </div>

      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Advanced Mode</h2>
          <InfoComponent
            description={`Shows more information about certain parts of the server\nAlso adds the DEBUG tab for logs, adb config, etc.`}
          />
        </div>
        <Button
          className="bg-transparent p-0"
          title="Automatically start deskthing when the computer boots"
          onClick={() => handleSettingChange('flag_nerd', !settings.flag_nerd)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.flag_nerd || false}
            className={`transition-color ${settings.flag_nerd ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>
      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Auto Start</h2>
          <InfoComponent description="Automatically start DeskThing when the computer boots." />
        </div>
        <Button
          className="bg-transparent p-0"
          title="Automatically start deskthing when the computer boots"
          onClick={() => handleSettingChange('server_autoStart', !settings.server_autoStart)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.server_autoStart}
            className={`transition-color ${settings.server_autoStart ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <div className="flex gap-1 items-center w-full">
          <h2 className="text-xl">Logging Level</h2>
          <InfoComponent description="Controls the verbosity of logs shown in the application." />
        </div>
        <Select
          options={logLevelOptions}
          value={settings.server_LogLevel}
          placeholder={settings.server_LogLevel}
          className="w-full"
          onChange={(selected) => {
            const selectedValue = selected as SingleValue<SettingOption>
            handleSettingChange(
              'server_LogLevel',
              (selectedValue?.value as LOG_FILTER) || LOG_FILTER.INFO
            )
          }}
        />
      </div>
      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Run In Background</h2>
          <InfoComponent description="Will let DeskThing run even while the GUI is not open." />
        </div>
        <Button
          title="Will let DeskThing run even while the GUI is not open"
          className="bg-transparent p-0"
          onClick={() => handleSettingChange('server_minimizeApp', !settings.server_minimizeApp)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.server_minimizeApp}
            className={`transition-color ${settings.server_minimizeApp ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>
      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Start Minimized</h2>
          <InfoComponent description="Will start DeskThing minimized." />
        </div>
        <Button
          title="Will start DeskThing minimized"
          className="bg-transparent p-0"
          onClick={() =>
            handleSettingChange('server_startMinimized', !settings.server_startMinimized)
          }
        >
          <IconToggle
            iconSize={48}
            checked={settings.server_startMinimized}
            className={`transition-color ${settings.server_startMinimized ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>
      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Auto Detect ADB</h2>
          <InfoComponent description="Automatically detects if devices are connected periodically." />
        </div>
        <Button
          className="bg-transparent p-0"
          title="Automatically detects if devices are connected periodically"
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
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Use Global ADB</h2>
          <InfoComponent description="Use the global ADB instance instead of the one in the app." />
        </div>
        <Button
          className="bg-transparent p-0"
          title="Use the global ADB instance instead of the one in the app"
          onClick={() => handleSettingChange('adb_useGlobal', !settings.adb_useGlobal)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.adb_useGlobal}
            className={`transition-color ${settings.adb_useGlobal ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>

      <div className="w-full p-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">ADB Blacklist</h2>
          <InfoComponent description="Comma-separated list of devices to ignore for ADB operations." />
        </div>
        <input
          type="text"
          value={settings.adb_blacklist?.join(', ')}
          onChange={(e) =>
            handleSettingChange(
              'adb_blacklist',
              e.target.value.split(',').map((s) => s.trim())
            )
          }
          className="border border-gray-300 focus:text-black text-gray-500 rounded px-2 py-1 w-1/2"
        />
      </div>

      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Auto Config</h2>
          <InfoComponent description="Automatically configures the car thing when it is detected (may be broken)." />
        </div>
        <Button
          title="Automatically configures the car thing when it is detected (may be broken)"
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

      <div className="w-full p-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Callback Port</h2>
          <InfoComponent
            description={`The port used for callbacks. Changing this also requires changing all of the app settings that use this port as well as their respective portals.`}
          />
        </div>
        <input
          type="number"
          value={settings.server_callbackPort}
          onChange={(e) => handleSettingChange('server_callbackPort', Number(e.target.value))}
          className="border border-gray-300 focus:text-black text-gray-500 rounded px-2 py-1"
        />
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Device Port</h2>
          <InfoComponent description="The port used to communicate with the device." />
        </div>
        <input
          type="number"
          value={settings.device_devicePort}
          onChange={(e) => handleSettingChange('device_devicePort', Number(e.target.value))}
          className="border border-gray-300 rounded focus:text-black text-gray-500 px-2 py-1"
        />
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Server Address</h2>
          <InfoComponent description="The address of the server to connect to." />
        </div>
        <input
          type="text"
          value={settings.device_address}
          onChange={(e) => handleSettingChange('device_address', e.target.value)}
          className="border border-gray-300 focus:text-black text-gray-500 rounded px-2 py-1"
        />
      </div>

      <div className="flex flex-col">
        <div className="w-full px-4 p-3 flex justify-between items-center">
          <div className="flex gap-1 items-center">
            <h2 className="text-xl">Run Firewall Configuration</h2>
            <InfoComponent description="Runs the firewall configuration for DeskThing." />
          </div>
          <Button
            className={`bg-zinc-900 ${!loading && 'hover:bg-zinc-800'}`}
            onClick={handleRefreshFirewall}
            disabled={firewallProgress.isLoading}
          >
            {firewallProgress.isLoading ? <IconLoading /> : <IconPlay />}
          </Button>
        </div>
        {firewallProgress.isLoading && firewallProgress.progress && (
          <div className="py-2">
            <LogEntry progressEvent={firewallProgress.progress} />
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="w-full px-4 flex justify-between items-center">
          <div className="flex gap-1 items-center">
            <h2 className="text-xl">Collect Anonymous Statistics</h2>
            <InfoComponent description="Help us improve DeskThing by sending anonymous usage statistics." />
          </div>
          <Button
            title="Help us improve DeskThing by sending anonymous usage statistics"
            className="bg-transparent p-0"
            onClick={() => handleSettingChange('flag_collectStats', !settings.flag_collectStats)}
          >
            <IconToggle
              iconSize={48}
              checked={settings.flag_collectStats}
              className={`transition-color ${settings.flag_collectStats ? 'text-green-500' : 'text-gray-500'}`}
            />
          </Button>
        </div>
        {!settings.flag_collectStats && (
          <div className="animate-fade-in-down px-4 py-2">
            <p className="text-gray-400">
              Hey there! Riprod here. As of v0.11.11, I&apos;ve added anonymous statistics
              collection to help me understand how many people are using DeskThing.
            </p>
            <p className="text-gray-400">
              My goal is to keep DeskThing completely free forever. These stats really help when
              talking to potential investors, which could help secure funding to keep the project
              going strong. It also helps keep me motivated knowing people are still using it!
            </p>
            <p className="text-gray-400">
              Of course, it&apos;s totally up to you whether to enable this or not - but it would
              mean a lot if you did!
            </p>
            <p className="text-gray-400">
              Thanks for being awesome! Hope you&apos;re enjoying DeskThing as much as I love
              working on it 🍞
            </p>
          </div>
        )}
      </div>
      <div className="border-t py-5 border-gray-900 w-full flex justify-end">
        <Button
          className={`border-green-500 border group gap-2 ${loading ? 'text-gray-100 bg-green-600' : 'hover:bg-green-500'}`}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <IconLoading /> : <IconSave className="stroke-2" />}
          <p>{loading ? 'Saving' : 'Save'}</p>
        </Button>
      </div>
    </div>
  )
}
export default ServerSettings

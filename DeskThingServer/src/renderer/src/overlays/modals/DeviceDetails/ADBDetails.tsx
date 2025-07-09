import {
  IconDisconnect,
  IconLoading,
  IconPause,
  IconPlay,
  IconPower,
  IconRefresh,
  IconReload,
  IconStop,
  IconUpload,
  IconWrench,
  IconX
} from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import React, { useState, useRef, useMemo } from 'react'
import { Client } from '@deskthing/types'
import usePlatformStore from '@renderer/stores/platformStore'
import { useSettingsStore } from '@renderer/stores'
import { ProgressChannel, SCRIPT_IDs } from '@shared/types'
import { LogEntry } from '@renderer/components/LogEntry'
import { useChannelProgress } from '@renderer/hooks/useProgress'

interface ClientDetailsOverlayProps {
  client: Client
}

const ADBDeviceDetails: React.FC<ClientDetailsOverlayProps> = ({ client }) => {
  const port = useSettingsStore((settings) => settings.settings.device_devicePort)
  const sendCommand = usePlatformStore((state) => state.runCommand)
  const modifyBrightness = usePlatformStore((state) => state.setBrightness)
  const setServiceStatus = usePlatformStore((state) => state.setServiceStatus)
  const pushStaged = usePlatformStore((state) => state.pushStaged)
  const pushScript = usePlatformStore((state) => state.pushScript)
  const progress = useChannelProgress(ProgressChannel.IPC_PLATFORM)
  const initialSettings = useSettingsStore((settings) => settings.settings)
  const saveSettings = useSettingsStore((settings) => settings.saveSettings)

  // ADB commands
  const [command, setCommand] = useState('')
  const [response, setResponse] = useState('')

  // State Management
  const [loading, setLoading] = useState(false)
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const [brightness, setBrightness] = useState(client.meta?.adb?.brightness || 50)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const adbId = useMemo(() => {
    if (client.meta.adb) {
      return client.meta.adb?.adbId
    } else {
      return undefined
    }
  }, [client.manifest?.context.method])

  const handleBrightnessChange = (value: number): void => {
    setBrightness(value)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        if (adbId) {
          if (client.meta.adb?.services?.backlight) {
            handleToggleSupervisor('backlight', false)
          }
          await modifyBrightness(adbId, value)
        }
      } catch (error) {
        console.error('Error setting brightness:', error)
      }
    }, 300)
  }

  const handlePushRestartScript = async (): Promise<void> => {
    if (!adbId) {
      console.warn('ADBID is not set - cant run script')
      return
    }
    setLoading(true)
    setAnimatingIcons((prev) => ({ ...prev, restart_script: true }))
    const result = await pushScript(adbId, SCRIPT_IDs.RESTART)
    setAnimatingIcons((prev) => ({ ...prev, restart_script: false }))
    setLoading(false)
    console.log('Finished with: ', result)
  }

  const handleToggleSupervisor = async (key: string, value: boolean): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, [key]: true }))

    try {
      await setServiceStatus(adbId!, key, value)
    } catch (error) {
      console.error(`Error toggling ${key}:`, error)
    } finally {
      setAnimatingIcons((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleExecuteCommand = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, command: true }))
    const response = await sendCommand(adbId!, command)
    setResponse(response || 'No response')
    setAnimatingIcons((prev) => ({ ...prev, command: false }))
  }

  const handlePushStaged = async (): Promise<void> => {
    if (!adbId) {
      console.error('ADB ID is required')
      return
    }

    try {
      setLoading(true)
      await pushStaged(adbId)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const restartChromium = async (): Promise<void> => {
    if (!adbId) return

    setAnimatingIcons((prev) => ({ ...prev, chromium: true }))
    await sendCommand(adbId, `shell supervisorctl restart chromium`)
    setTimeout(() => {
      setAnimatingIcons((prev) => ({ ...prev, chromium: false }))
    }, 1000)
  }

  const openPort = async (): Promise<void> => {
    if (!adbId) {
      console.error('Unable to find ADB ID', adbId)
      return
    }
    await sendCommand(adbId, `reverse tcp:${port} tcp:${port}`)
  }

  const handleRestart = async (): Promise<void> => {
    if (!adbId) return

    setAnimatingIcons((prev) => ({ ...prev, restart: true }))
    await sendCommand(adbId, 'shell reboot')
    setTimeout(() => {
      setAnimatingIcons((prev) => ({ ...prev, restart: false }))
    }, 300)
  }

  const handleShutdown = async (): Promise<void> => {
    if (!adbId) return
    await sendCommand(adbId, 'shell poweroff')
  }

  const handleAddToSettings = async (): Promise<void> => {
    if (!adbId) return

    setLoading(true)
    const currentBlacklist = initialSettings.adb_blacklist || []
    if (!currentBlacklist.includes(adbId)) {
      const updatedBlacklist = [...currentBlacklist, adbId]
      await saveSettings({ ...initialSettings, adb_blacklist: updatedBlacklist })
      console.log('ADB ID added to blacklist:', adbId)
    } else {
      const updatedBlacklist = currentBlacklist.filter((id) => id !== adbId)
      await saveSettings({ ...initialSettings, adb_blacklist: updatedBlacklist })
      console.warn('ADB ID removed from blacklist:', adbId)
    }
    setLoading(false)
  }

  return (
    <div className="h-full p-4 overflow-y-auto bg-zinc-950">
      {client.identifiers.adb && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between gap-4">
            <Button
              title="Set Device Client to Staged Client"
              className="bg-zinc-900 hover:bg-zinc-800 min-w-fit transition-colors duration-200 gap-2 rounded-lg p-3"
              onClick={handlePushStaged}
              disabled={loading}
            >
              {loading ? (
                <IconLoading className="flex-shrink-0 animate-spin" />
              ) : (
                <IconUpload className="flex-shrink-0" />
              )}
              <p className="sm:block text-ellipsis hidden text-nowrap">Push Staged</p>
            </Button>
            <Button
              title="Restart Client's Chromium"
              className="bg-zinc-900 hover:bg-zinc-800 min-w-fit transition-colors duration-200 gap-2 rounded-lg p-3"
              onClick={restartChromium}
              disabled={loading}
            >
              <IconRefresh
                className={`transition-transform flex-shrink-0 duration-1000 ${
                  animatingIcons.chromium ? 'rotate-[360deg]' : ''
                }`}
              />
              <p className="sm:block text-ellipsis hidden text-nowrap">Reload Chromium</p>
            </Button>
            <Button
              title="Setup ADB Port for Device"
              className="bg-zinc-900 hover:bg-zinc-800 min-w-fit transition-colors duration-200 gap-2 rounded-lg p-3"
              onClick={openPort}
              disabled={loading}
            >
              <IconDisconnect className="flex-shrink-0" />
              <p className="sm:block text-ellipsis hidden text-nowrap">Setup Port</p>
            </Button>
            <Button
              title="Restart the Client"
              className="bg-zinc-900 hover:bg-zinc-800 border-red-500/50 border transition-colors duration-200 gap-2 rounded-lg p-3"
              onClick={handleRestart}
              disabled={loading}
            >
              <IconReload
                className={`transition-transform flex-shrink-0 duration-500 ${
                  animatingIcons.restart ? '-rotate-[360deg]' : ''
                }`}
              />
              <p className="sm:block text-ellipsis hidden text-nowrap">Restart</p>
            </Button>
            <Button
              title="Shutdown the Client"
              className="bg-zinc-900 hover:bg-zinc-800 border-red-500/50 border transition-colors duration-200 gap-2 rounded-lg p-3"
              onClick={handleShutdown}
              disabled={loading}
            >
              {loading ? (
                <IconLoading className="animate-spin-smooth flex-shrink-0" />
              ) : (
                <IconPower className="flex-shrink-0" />
              )}
              <p className="sm:block text-ellipsis hidden text-nowrap">Power Off</p>
            </Button>
            <Button
              title="Run Restart Script"
              className="bg-zinc-900 hover:bg-zinc-800 transition-colors duration-200 gap-2 rounded-lg p-3"
              onClick={handlePushRestartScript}
              disabled={loading}
            >
              {loading ? (
                <IconLoading className="animate-spin-smooth flex-shrink-0" />
              ) : (
                <IconWrench className="flex-shrink-0" />
              )}
              <p className="sm:block text-ellipsis hidden text-nowrap">Setup Restart Script</p>
            </Button>
            <Button
              title="Add this device to the blacklist"
              className="bg-zinc-900 hover:bg-zinc-800 transition-colors duration-200 gap-2 rounded-lg p-3"
              onClick={handleAddToSettings}
              disabled={loading}
            >
              {initialSettings.adb_blacklist?.includes(adbId!) ? (
                <>
                  {loading ? (
                    <IconLoading className="animate-spin-smooth flex-shrink-0" />
                  ) : (
                    <IconX className="flex-shrink-0" />
                  )}
                  <p className="sm:block text-ellipsis hidden text-nowrap">Remove From BlackList</p>
                </>
              ) : (
                <>
                  {loading ? (
                    <IconLoading className="animate-spin-smooth flex-shrink-0" />
                  ) : (
                    <IconStop className="flex-shrink-0" />
                  )}
                  <p className="sm:block text-ellipsis hidden text-nowrap">Add to BlackList</p>
                </>
              )}
            </Button>
          </div>

          {progress.progress && (
            <div className="w-full">
              <LogEntry className="w-full" progressEvent={progress.progress} />
            </div>
          )}

          <div className="bg-zinc-900 p-4 rounded-lg">
            <p className="text-sm font-geistMono text-zinc-400 mb-2">Brightness</p>
            <input
              id="brightness-slider"
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg accent-white appearance-none cursor-pointer"
            />
            <p className="text-sm font-geistMono text-zinc-500 mt-2">{brightness}%</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 p-4 rounded-lg">
              <p className="text-sm font-geistMono text-zinc-400">Device Version</p>
              <h3 className="text-xl mt-2">{client.meta.adb?.device_version || 'Unknown'}</h3>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <p className="text-sm font-geistMono text-zinc-400">USID</p>
              <h3 className="text-xl mt-2">{client.meta.adb?.usid || 'Unknown'}</h3>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <p className="text-sm font-geistMono text-zinc-400">MAC BT</p>
              <h3 className="text-xl mt-2">{client.meta.adb?.mac_bt || 'Unknown'}</h3>
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg">
            <p className="text-sm font-geistMono text-zinc-400 mb-4">Supervisor Status</p>
            <div className="space-y-3">
              {client.meta.adb?.services &&
                Object.entries(client.meta.adb?.services).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg"
                  >
                    <h3 className="text-lg">
                      {key}:{' '}
                      <span className={value ? 'text-green-500' : 'text-red-500'}>
                        {String(value)}
                      </span>
                    </h3>
                    <Button
                      title="Toggle Supervisor"
                      className="bg-zinc-900 hover:bg-zinc-800 min-w-fit transition-colors duration-200 gap-2 px-4"
                      onClick={() => handleToggleSupervisor(key, !value)}
                      disabled={animatingIcons[key]}
                    >
                      <p className="sm:block text-ellipsis hidden text-nowrap">
                        {animatingIcons[key] ? 'Loading' : value ? 'Disable' : 'Enable'}
                      </p>
                      {animatingIcons[key] ? (
                        <IconLoading className="animate-spin" />
                      ) : value ? (
                        <IconPause className="text-red-500" />
                      ) : (
                        <IconPlay className="text-green-500" />
                      )}
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleExecuteCommand()
              }}
              className="flex gap-3 items-center w-full"
            >
              <input
                onChange={(e) => setCommand(e.target.value)}
                value={command}
                type="text"
                placeholder="Enter ADB command..."
                className="flex-1 px-4 py-2 bg-zinc-800 rounded-lg text-white border border-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors duration-200"
              />
              <Button
                title="Execute Command"
                className="bg-zinc-800 hover:bg-zinc-700 transition-colors duration-200 p-2 rounded-lg"
                type="submit"
              >
                {animatingIcons.command ? (
                  <IconLoading className="animate-spin" />
                ) : (
                  <IconPlay className="text-green-500" />
                )}
              </Button>
            </form>
            {response && (
              <div className="bg-zinc-800 p-4 rounded-lg mt-4">
                {response.split('\n').map((line, index) => (
                  <p key={index} className="text-sm font-geistMono text-zinc-300">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ADBDeviceDetails

import { useEffect, useState } from 'react'
import DisplayDeviceData from '../../overlays/DisplayDeviceData'
import ClientSettings from '../../components/ClientSettings'
import Widget from '../../components/Widget'
import clientStore from '@renderer/store/clientStore'
import { IconCarThing } from '../../assets/icons'
import logStore, { Log } from '@renderer/store/logStore'
import { App, AppData, appStoreInstance } from '@renderer/store'

const Dashboard = (): JSX.Element => {
  const [devices, setDevices] = useState<string[]>([])
  const [enabled, setEnabled] = useState(false)
  const [currentDevice, setCurrentDevice] = useState('')
  const [logs, setLogs] = useState<Log[]>([])
  const [apps, setApps] = useState<App[]>([])

  useEffect(() => {
    const handleADBDevice = (devices: string[]): void => {
      setDevices(devices)
    }
    const handleLogs = (newLog: Log[]): void => {
      const nextLog = newLog.pop()
      if (nextLog) {
        setLogs((prevLogs) => {
          const updatedLogs = [nextLog, ...prevLogs].slice(0, 7)
          return updatedLogs
        })
      }
    }
    const handleAppUpdate = (apps: AppData): void => {
      setApps(apps.apps)
    }

    appStoreInstance.on('update', handleAppUpdate)
    const listener = clientStore.on('ADBDevices', handleADBDevice)
    logStore.on('update', handleLogs)
    const initializeADB = async (): Promise<void> => {
      let devices = await clientStore.getADBDevices()
      if (!devices) {
        devices = await clientStore.requestADBDevices()
      }
      setDevices(devices)
      setApps(appStoreInstance.getAppsList().apps)
      setLogs((await logStore.getLogs()).slice(0, 7))
    }
    initializeADB()
    return () => {
      listener()
      logStore.off('update', handleLogs)
      appStoreInstance.off('update', handleAppUpdate)
    }
  }, [])

  return (
    <div className="pt-5 grid gap-2 max-w-full overflow-hidden w-full items-center p-5">
      {enabled && <DisplayDeviceData setEnabled={setEnabled} device={currentDevice} />}
      <Widget>
        <div className="p-5">
          <ClientSettings />
        </div>
      </Widget>
      <div className="flex gap-3 overflow-y-scroll max-w-full justify-between">
        <div className="">
          <Widget>
            <div className="px-3 ">
              {devices.length > 0 ? (
                devices.map((device) => (
                  <div
                    key={device}
                    className="flex-col min-w-fit items-center hover:text-green-500 justify-between w-full"
                  >
                    <button
                      onClick={() => {
                        setCurrentDevice(device)
                        setEnabled(true)
                      }}
                      className="text-sm"
                    >
                      <IconCarThing text={device} iconSize={124} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-2">
                  <p className="font-geistMono text-center">No Device Detected</p>
                </div>
              )}
            </div>
          </Widget>
        </div>
        <Widget>
          <div className="flex flex-col-reverse bottom-0">
            {logs.length > 0 &&
              logs.map((log, index) => (
                <div key={index} className={`text-xs font-geistMono transition-all duration-500`}>
                  <p
                    className={`p-2 ${getBackgroundColor(log.type.toLowerCase())} border-t border-zinc-900`}
                  >
                    {log.log}
                  </p>
                </div>
              ))}
          </div>
        </Widget>
      </div>
      <Widget>
        <div className="p-5">
          {apps &&
            apps.map((app, index) => (
              <div
                key={index}
                className="flex border-b p-2 border-slate-700 flex-row items-center justify-between w-full"
              >
                <div className="flex flex-row items-center justify-between w-full">
                  <div>
                    <p>{app.manifest ? app.manifest.label : app.name}</p>
                    <p className="text-zinc-400 text-xs font-geistMono">{app.manifest?.version}</p>
                  </div>
                  <div>
                    {app.enabled && <p className="text-zinc-400 text-xs font-geistMono">Enabled</p>}
                    {app.running && <p className="text-zinc-400 text-xs font-geistMono">Running</p>}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Widget>
    </div>
  )
}

const getBackgroundColor = (type: string): string => {
  switch (type) {
    case 'log':
      return 'text-zinc-500'
    case 'message':
      return 'bg-zinc-900 hover:bg-zinc-800'
    case 'error':
      return 'bg-red-700 hover:bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export default Dashboard

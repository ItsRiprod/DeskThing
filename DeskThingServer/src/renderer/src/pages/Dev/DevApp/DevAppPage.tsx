import React, { useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import MainElement from '@renderer/nav/MainElement'
import Button from '@renderer/components/Button'
import { IconRefresh, IconPlay, IconToggle } from '@renderer/assets/icons'
import { useClientStore, useSettingsStore } from '@renderer/stores'
import { ClientConnectionMethod } from '@deskthing/types'

/** Instructions for setting up the Developer App */
const DevAppInstructions: React.FC = () => (
  <div className="mb-6 p-4 rounded-xl bg-zinc-950 border border-zinc-900">
    <h2 className="text-xl font-semibold mb-2">Developer App Setup Instructions</h2>
    <ol className="list-decimal ml-5 space-y-2 text-gray-300">
      <li>
        <b>Download the Lite Client:</b> Go to <a href="https://github.com/itsriprod/deskthing-liteclient" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">https://github.com/itsriprod/deskthing-liteclient</a> and follow the instructions to add the client to your device.
      </li>
      <li>
        <b>On your device:</b> Open the Lite Client, navigate to <b>Settings &rarr; Dev Mode &rarr; Developer App</b>.
      </li>
      <li>
        <b>Enter the Dev Port:</b> This is usually <code className="bg-zinc-900 px-1 rounded">3000</code> unless you changed it.
      </li>
      <li>
        <b>Start the Developer Emulator:</b> In your app directory, run <code className="bg-zinc-900 px-1 rounded">npx @deskthing/cli@latest dev</code> or <code className="bg-zinc-900 px-1 rounded">npm run dev</code> for apps made with DeskThing.
      </li>
      <li>
        <b>Configure Dev Mode:</b> Select your device below, enter the port, and click <b>Configure Dev Mode</b> to forward the port to your device using ADB.
      </li>
    </ol>
  </div>
)

/** Device selector and port forwarding controls */
const DevAppADBControls: React.FC<{
  adbDevices: any[]
  refreshing: boolean
  onRefresh: () => void
  selectedDevice: string
  setSelectedDevice: (id: string) => void
  devPort: string
  setDevPort: (port: string) => void
  onForward: () => void
  loading: boolean
  response: string
}> = ({
  adbDevices,
  refreshing,
  onRefresh,
  selectedDevice,
  setSelectedDevice,
  devPort,
  setDevPort,
  onForward,
  loading,
  response
}) => (
  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 mb-6">
    <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
      <select
        className="p-2 rounded text-black"
        value={selectedDevice}
        onChange={e => setSelectedDevice(e.target.value)}
      >
        {adbDevices.map(device => (
          <option key={device.meta.adb?.adbId} value={device.meta.adb?.adbId}>
            {device.meta.adb?.adbId}
          </option>
        ))}
        <option value="">None</option>
      </select>
      <input
        type="number"
        className="p-2 rounded text-black w-32"
        placeholder="Dev Port (e.g. 3000)"
        value={devPort}
        onChange={e => setDevPort(e.target.value)}
        min={1}
        max={65535}
      />
      <Button
        className="border group border-cyan-500 hover:bg-cyan-500 flex gap-2"
        onClick={onForward}
        disabled={loading || !selectedDevice || !devPort}
      >
        <span>Configure Dev Mode</span>
        <IconPlay />
      </Button>
      <Button
        className={refreshing ? 'text-gray-300' : 'hover:bg-zinc-900'}
        onClick={onRefresh}
        disabled={refreshing}
      >
        <IconRefresh className={refreshing ? 'animate-spin' : ''} />
        <span className="ml-1">Refresh Devices</span>
      </Button>
    </div>
    <div className="font-geistMono w-full bg-zinc-900 p-3 rounded min-h-[2.5rem]">
      {response ? response.split('\n').map((line, i) => <div key={i}>{line}</div>) : <span className="text-gray-400">ADB command output will appear here.</span>}
    </div>
  </div>
)

const DevAppPage: React.FC = () => {
  const [devPort, setDevPort] = useState('3000')
  const [selectedDevice, setSelectedDevice] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [response, setResponse] = useState('')

  const clients = useClientStore(store => store.clients)
  const adbDevices = clients.filter(
    client => client.manifest?.context.method === ClientConnectionMethod.ADB
  )
  const refreshDevices = useClientStore(store => store.requestADBDevices)

  // Refresh ADB devices
  const handleRefreshDevices = async () => {
    setRefreshing(true)
    await refreshDevices()
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Forward dev port to device using ADB
  const handleForwardPort = async () => {
    if (!selectedDevice || !devPort) return
    setLoading(true)
    setResponse('Forwarding port...')
    // Example: adb -s <device> forward tcp:3000 tcp:3000
    const adbCommand = `-s ${selectedDevice} reverse tcp:${devPort} tcp:${devPort}`
    const res = await window.electron.client.handleClientADB(adbCommand)
    setResponse(res || 'Port forwarded.')
    setLoading(false)
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar className="flex justify-end flex-col h-full max-h-full md:items-stretch xs:items-center">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-400 text-center px-2">
            Developer App Setup
          </p>
        </div>
      </Sidebar>
      <MainElement className="p-4">
        <div className="w-full h-full relative overflow-y-auto flex flex-col">
          <DevAppInstructions />
          <DevAppADBControls
            adbDevices={adbDevices}
            refreshing={refreshing}
            onRefresh={handleRefreshDevices}
            selectedDevice={selectedDevice}
            setSelectedDevice={setSelectedDevice}
            devPort={devPort}
            setDevPort={setDevPort}
            onForward={handleForwardPort}
            loading={loading}
            response={response}
          />
        </div>
      </MainElement>
    </div>
  )
}

export default DevAppPage

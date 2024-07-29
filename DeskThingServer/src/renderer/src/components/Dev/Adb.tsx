import { useState } from 'react'
import { IconLogoGearLoading, IconPlay, IconRefresh } from '../icons'

const Adb = (): JSX.Element => {
  const [type, setType] = useState<string>('')
  const [command, setCommands] = useState<string>('')
  const [wsToolTip, setWStooltip] = useState('')
  const [response, setResponse] = useState('')
  const [view, setView] = useState('')

  const handleCommandChange = (command: string): void => {
    setCommands(command)
  }
  const handleTypeChange = (type: string): void => {
    setType(type)
  }
  const handleViewChange = (type: string): void => {
    setView(type)
  }

  const handleSendCommand = async (): Promise<void> => {
    if (command) {
      if (type == 'adb') {
        setResponse('waiting')
        setWStooltip('Sending...')
        const response = await window.electron.runAdbCommand(command)
        if (response) {
          setResponse(response)
        } else {
          setResponse('No response')
        }
        setWStooltip('')
      } else {
        await window.electron.runDeviceCommand(type, view ? '"' + view + '"' : command)

        setResponse('Sent!')
      }
    }
  }
  const handleChangeView = async (): Promise<void> => {
    setType('set_view')
    handleSendCommand()
  }
  const handleRestartAdb = async (): Promise<void> => {
    const first_command = 'kill-server'
    const second_command = 'start-server'
    setResponse('Shutting down ADB server')
    await window.electron.runAdbCommand(first_command)
    setResponse('Starting server again')
    const response = await window.electron.runAdbCommand(second_command)
    setResponse('Server Started')
    console.log(response)
  }

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex flex-col gap-1 justify-end items-end">
        <div className="flex mb-5 items-center">
          <p className="mr-3">Change View</p>
          <input
            type="text"
            placeholder="Enter View"
            value={view || ''}
            onChange={(e) => handleViewChange(e.target.value)}
            className="border-2 border-gray-300 p-2 rounded-lg text-black"
          />
          <button
            onClick={() => handleChangeView()}
            className="border-2 border-cyan-600 hover:bg-cyan-500 p-2 rounded-lg"
          >
            <IconPlay iconSize={24} />
          </button>
        </div>
        <div className="flex mb-5 items-center">
          <p className="mr-3">Restart ADB server</p>
          <button
            onClick={() => handleRestartAdb()}
            className="border-2 border-orange-600 hover:bg-orange-500 p-2 rounded-lg"
          >
            <IconRefresh iconSize={24} />
          </button>
        </div>
        <div>
          <input
            type="text"
            placeholder="Enter type"
            value={type || ''}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="border-2 border-gray-300 p-2 rounded-lg text-black"
          />

          <input
            type="text"
            placeholder="Enter command"
            value={command || ''}
            onChange={(e) => handleCommandChange(e.target.value)}
            className="border-2 border-gray-300 p-2 rounded-lg text-black"
          />
        </div>
        <div className="flex items-center">
          {wsToolTip ? (
            <p className="relative">{wsToolTip}</p>
          ) : (
            <p className="relative text-zinc-500">
              <i>Warning: Advanced use only. May cause damage.</i>
            </p>
          )}
          {response == 'waiting' ? (
            <IconLogoGearLoading iconSize={45} />
          ) : (
            <button
              onClick={() => handleSendCommand()}
              className="border-2 border-cyan-600 hover:bg-cyan-500 p-2 rounded-lg"
              onMouseEnter={() =>
                setWStooltip(type == 'adb' ? 'Send ADB Command' : 'Send WS Command')
              }
              onMouseLeave={() => setWStooltip('')}
            >
              <IconPlay iconSize={24} />
            </button>
          )}
        </div>
        <div className="font-geistMono w-full bg-zinc-900 h-full p-3">
          {response ? response : <p>Response</p>}
        </div>
      </div>
    </div>
  )
}

export default Adb

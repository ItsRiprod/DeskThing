import { useState } from 'react'
import { IconLogoGearLoading, IconPlay, IconRefresh } from '../icons'

const Adb = (): JSX.Element => {
  const [type, setType] = useState<string>('')
  const [command, setCommands] = useState<string>('')
  const [previousCommands, setPreviousCommands] = useState<string[]>([])
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
      setPreviousCommands((prev) => [...new Set([command, ...prev])])
      if (type == 'adb') {
        setResponse('Sending...')
        setWStooltip('Sending...')
        const unsubscribe = window.electron.ipcRenderer.on('logging', (_event, reply) => {
          console.log(reply)
          if (reply.final) {
            unsubscribe()
          }
          if (!reply.status) {
            setResponse((prev) => prev + '\n ' + reply.error)
            unsubscribe()
          } else {
            if (reply.data) {
              setResponse((prev) => prev + '\n ' + reply.data)
            }
          }
        })
        const response = await window.electron.runAdbCommand(command)
        if (response) {
          setResponse((prev) => prev + '\n ' + response)
        } else {
          setResponse('No response')
        }
        unsubscribe()
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

  const handleCommandClick = (cmd: string): void => {
    setCommands(cmd)
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
      <div className="flex flex-col gap-1 justify-end w-full items-end">
        <div className="flex justify-between w-full p-5">
          <div>
            {previousCommands.length > 0 && (
              <div className="mt-4 w-full">
                <p>Previous Commands:</p>
                <div className="flex gap-2 flex-wrap">
                  {previousCommands.map((cmd, index) => (
                    <button
                      key={index}
                      onClick={() => handleCommandClick(cmd)}
                      className="text-left border-2 font-geistMono border-gray-700 p-2 w-fit rounded-xl hover:bg-gray-600 text-white"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end">
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
          </div>
        </div>
        <div className="flex w-full">
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
            className="border-2 border-gray-300 w-full p-2 rounded-lg text-black"
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
          {response ? (
            response.split('\n').map((line, index) => <div key={index}>{line}</div>)
          ) : (
            <p>Response</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Adb

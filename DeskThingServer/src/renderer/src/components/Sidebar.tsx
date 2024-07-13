import React, { useEffect } from 'react'
import { IconConnected, IconConnecting, IconLogo } from './icons'

type View = 'appsList' | 'status' | 'logDisplay' // Define possible views

interface SidebarProps {
  setCurrentView: React.Dispatch<React.SetStateAction<View>>
  currentView: View
}

const Sidebar: React.FC<SidebarProps> = ({ setCurrentView, currentView }) => {
  const [connections, setConnections] = React.useState<number>(0)
  const handleClick = (view: View): void => {
    setCurrentView(view)
  }

  const getConnections = (): void => window.electron.ipcRenderer.send('get-connections')

  useEffect(() => {
    const handleConnection = (_event, num: number): void => {
      setConnections(num)
      console.log('got connections', num)
    }

    console.log('got connections', connections)
    const removeListener = window.electron.ipcRenderer.on('connections', handleConnection)

    const timeoutId = setTimeout(() => {
      getConnections()
    }, 1500)

    return () => {
      removeListener()
      clearTimeout(timeoutId)
    }
  }, [])

  const version = process.env.PACKAGE_VERSION

  return (
    <div className="container w-full top-0 sm:pt-5 sm:px-3 sm:max-w-52 gap-5 sm:relative rounded-lg flex sm:flex-col sm:overflow-y-hidden overflow-y-scroll items-center border-2 border-zinc-800 sm:h-full p-2">
      <div className="flex items-center">
        {connections == 0 ? (
          <IconConnecting className="text-white pt-1" iconSize={24} />
        ) : (
          <div className="text-green-500 flex">
            <p className="text-xs">{connections == 1 ? '' : connections}</p>
            <IconConnected className=" pt-1" iconSize={24} />
          </div>
        )}
        <IconLogo width={110} height={30} iconSize={50} />
        <p className="text-sm">v{version}</p>
      </div>
      <ul className="flex gap-5 sm:flex-col w-full">
        <li>
          <button
            className={`${currentView === 'appsList' ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'} border min-w-24 rounded-md w-full p-3`}
            onClick={() => handleClick('appsList')}
          >
            Apps List
          </button>
        </li>
        <li>
          <button
            className={`${currentView === 'status' ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'} border rounded-md w-full p-3`}
            onClick={() => handleClick('status')}
          >
            Status
          </button>
        </li>
        <li>
          <button
            className={`${currentView === 'logDisplay' ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'} border rounded-md w-full p-3`}
            onClick={() => handleClick('logDisplay')}
          >
            Logs
          </button>
        </li>
      </ul>
    </div>
  )
}

export default Sidebar

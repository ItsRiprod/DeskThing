import React, { useEffect, useState } from 'react'
import { IconCoffee, IconConnected, IconConnecting, IconLogo, IconLogoGear } from './icons'
import { useReward } from 'react-rewards'

type View = 'appsList' | 'status' | 'logDisplay' // Define possible views

interface SidebarProps {
  setCurrentView: React.Dispatch<React.SetStateAction<View>>
  currentView: View
}

const Sidebar: React.FC<SidebarProps> = ({ setCurrentView, currentView }) => {
  const [connections, setConnections] = useState<number>(0)
  const confettiConfig = {
    startVelocity: 6,
    elementCount: 7,
    decay: 0.99
  }
  const { reward } = useReward('rewardId', 'confetti', confettiConfig)
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
    <div className="container w-full top-0 sm:pt-5 sm:justify-between sm:px-3 sm:max-w-52 gap-5 sm:relative rounded-lg flex sm:flex-col sm:overflow-y-hidden overflow-y-scroll items-center border-2 border-zinc-800 sm:h-full p-2">
      <div className="container w-full top-0 gap-5 sm:relative flex sm:flex-col items-center">
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
              className={`${currentView === 'appsList' ? 'bg-zinc-800 hover:bg-zinc-700 border-green-500' : 'hover:bg-zinc-900'} border-l min-w-24 rounded-md w-full p-3`}
              onClick={() => handleClick('appsList')}
            >
              Apps List
            </button>
          </li>
          <li>
            <button
              className={`${currentView === 'status' ? 'bg-zinc-800 hover:bg-zinc-700 border-green-500' : 'hover:bg-zinc-900'} border-l rounded-md w-full p-3`}
              onClick={() => handleClick('status')}
            >
              Status
            </button>
          </li>
          <li>
            <button
              className={`${currentView === 'logDisplay' ? 'bg-zinc-800 hover:bg-zinc-700 border-green-500' : 'hover:bg-zinc-900'} border-l rounded-md w-full p-3`}
              onClick={() => handleClick('logDisplay')}
            >
              Logs
            </button>
          </li>
        </ul>
      </div>
      <div className="flex justify-start gap-3 w-full items-center text-zinc-500">
        <button className=" border p-2 rounded-xl border-zinc-500">
          <IconLogoGear iconSize={31} />
        </button>
        <a
          href="https://buymeacoffee.com/riprod"
          target="_blank"
          rel="noreferrer"
          className="fill-fuchsia-600 hover:bg-fuchsia-600 hover:text-black hover:border-fuchsia-600 text-fuchsia-600 border p-3 rounded-xl border-zinc-500"
          onMouseEnter={reward}
        >
          <span id="rewardId" />
          <IconCoffee iconSize={23} strokeWidth={2} />
        </a>
      </div>
    </div>
  )
}

export default Sidebar

import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import {
  IconCarThing,
  IconCoffee,
  IconConnected,
  IconConnecting,
  IconHome,
  IconLayoutgrid,
  IconLogo,
  IconLogoGear,
  IconPower,
  IconWrench
} from '../assets/icons'
import { useReward } from 'react-rewards'
import SettingsOverlay from '../overlays/SettingsOverlay'
import { SidebarView } from '../App'
import { ClientStore } from '@renderer/store'

interface SidebarProps {
  setCurrentView: Dispatch<SetStateAction<SidebarView>>
  currentView: SidebarView
}

const Sidebar: React.FC<SidebarProps> = ({ setCurrentView, currentView }) => {
  const [connections, setConnections] = useState<number>(0)
  const [enabled, setEnabled] = useState<boolean>(false)
  const confettiConfig = {
    startVelocity: 6,
    elementCount: 7,
    decay: 0.99
  }
  const { reward } = useReward('rewardId', 'confetti', confettiConfig)
  const handleClick = (view: SidebarView): void => {
    setCurrentView(view)
  }

  useEffect(() => {
    const handleConnection = (data: number): void => {
      setConnections(data)
      console.log('got connections', data)
    }

    console.log('got connections', connections)
    const removeListener = ClientStore.on('Connections', (data) => handleConnection(data as number))
    const timeoutId = setTimeout(() => {
      ClientStore.requestConnections()
    }, 1500)

    const intervalId = setInterval(() => {
      ClientStore.requestConnections()
    }, 30000)

    return () => {
      removeListener()
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [])

  const version = process.env.PACKAGE_VERSION

  return (
    <div className="container w-full top-0 sm:pt-5 sm:justify-between sm:px-3 md:max-w-52 sm:max-w-24 gap-5 sm:relative rounded-lg flex sm:flex-col sm:overflow-x-hidden overflow-x-scroll items-center border-2 border-zinc-800 sm:h-full p-2">
      <div className="container w-full top-0 gap-5 sm:relative flex sm:flex-col items-center">
        {enabled && <SettingsOverlay setEnabled={setEnabled} />}
        <div className="flex items-center">
          {connections == 0 ? (
            <IconConnecting className="text-white pt-1" iconSize={24} />
          ) : (
            <div className="text-green-500 flex">
              <p className="text-xs">{connections == 1 ? '' : connections}</p>
              <IconConnected className=" pt-1" iconSize={24} />
            </div>
          )}
          <IconLogo width={110} height={30} iconSize={50} className={'hidden md:inline'} />
          <p className="text-sm hidden md:inline">v{version}</p>
        </div>
        <ul className="flex gap-5 sm:flex-col w-full">
          <li>
            <button
              className={`${currentView === 'home' ? 'bg-zinc-800 hover:bg-zinc-700 border-green-500' : 'hover:bg-zinc-900'} sm:border-l flex gap-3 rounded-md w-full p-3`}
              onClick={() => handleClick('home')}
            >
              <IconHome />
              <span className="hidden md:inline">Home</span>
            </button>
          </li>
          <li>
            <button
              className={`${currentView === 'apps' ? 'bg-zinc-800 hover:bg-zinc-700 border-green-500' : 'hover:bg-zinc-900'} sm:border-l rounded-md flex gap-3 w-full p-3`}
              onClick={() => handleClick('apps')}
            >
              <IconLayoutgrid />
              <span className="hidden md:inline">Apps</span>
            </button>
          </li>
          <li>
            <button
              className={`${currentView === 'client' ? 'bg-zinc-800 hover:bg-zinc-700 border-green-500' : 'hover:bg-zinc-900'} sm:border-l rounded-md flex gap-3 w-full p-3`}
              onClick={() => handleClick('client')}
            >
              <IconCarThing strokeWidth={18} />
              <span className="hidden md:inline">Client</span>
            </button>
          </li>
          <li>
            <button
              className={`${currentView === 'dev' ? 'bg-zinc-800 hover:bg-zinc-700 border-green-500' : 'hover:bg-zinc-900'} sm:border-l rounded-md flex gap-3 w-full p-3`}
              onClick={() => handleClick('dev')}
            >
              <IconWrench />
              <span className="hidden md:inline">Dev</span>
            </button>
          </li>
        </ul>
      </div>
      <div className="flex sm:flex-col md:flex-row sm:items-start md:items-end sm:justify-between justify-start gap-3 w-full items-end text-zinc-500">
        <button
          className="group sm:flex-col items-center flex-row-reverse flex sm:border p-2 rounded-xl border-zinc-500 hover:bg-zinc-900 hover:text-red-500"
          onClick={() => window.electron.ipcRenderer.send('shutdown')}
        >
          <p className="group-hover:block hidden">Shutdown</p>
          <IconPower iconSize={24} />
        </button>
        <a
          href="https://buymeacoffee.com/riprod"
          target="_blank"
          rel="noreferrer"
          className="group sm:flex-col items-center flex-row-reverse flex fill-fuchsia-600 hover:bg-fuchsia-600 hover:text-black hover:border-fuchsia-600 text-fuchsia-600 sm:border p-2 rounded-xl border-zinc-500"
          onMouseEnter={reward}
        >
          <span id="rewardId" />
          <p className="group-hover:block hidden">Support!</p>
          <IconCoffee iconSize={24} strokeWidth={2} />
        </a>
        <button
          className="group sm:flex-col items-center flex-row-reverse flex sm:border p-2 rounded-xl border-zinc-500 hover:bg-zinc-900 hover:text-white"
          onClick={() => setEnabled(true)}
        >
          <p className="group-hover:block hidden">Settings</p>
          <IconLogoGear iconSize={24} />
        </button>
      </div>
    </div>
  )
}

export default Sidebar

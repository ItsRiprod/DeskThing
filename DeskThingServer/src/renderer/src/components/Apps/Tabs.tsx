import React from 'react'
import { View } from '.'

interface TopbarProps {
  setCurrentView: React.Dispatch<React.SetStateAction<View>>
  currentView: View
}

const Tabs: React.FC<TopbarProps> = ({ setCurrentView, currentView }) => {
  const handleClick = (view: View): void => {
    setCurrentView(view)
  }

  return (
    <div className="w-full top-0 p-0 gap-5 h-fit flex-shrink-0 sm:relative rounded-lg flex overflow-x-scroll items-center">
      <div className="flex justify-evenly w-full border-b-2 border-zinc-800">
        <button
          className={`${currentView === 'apps' ? 'bg-zinc-800 hover:bg-zinc-700 border-b-2 border-green-500' : 'hover:bg-zinc-900'} flex-grow p-3`}
          onClick={() => handleClick('apps')}
        >
          Loaded<span className="hidden sm:inline"> Apps</span>
        </button>
        <button
          className={`${currentView === 'web' ? 'bg-zinc-800 hover:bg-zinc-700 border-b-2 border-green-500' : 'hover:bg-zinc-900'} flex-grow p-3`}
          onClick={() => handleClick('web')}
        >
          Online<span className="hidden sm:inline"> Apps</span>
        </button>
        <button
          className={`${currentView === 'local' ? 'bg-zinc-800 hover:bg-zinc-700 border-b-2 border-green-500' : 'hover:bg-zinc-900'} flex-grow p-3`}
          onClick={() => handleClick('local')}
        >
          Local<span className="hidden sm:inline"> Apps</span>
        </button>
      </div>
    </div>
  )
}

export default Tabs

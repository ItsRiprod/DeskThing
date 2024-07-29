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
          className={`${currentView === 'mappings' ? 'bg-zinc-900 hover:bg-zinc-700 border-b-2 border-green-500' : 'hover:bg-zinc-800'} flex-grow p-3`}
          onClick={() => handleClick('mappings')}
        >
          Key Mappings
        </button>
        <button
          className={`${currentView === 'status' ? 'bg-zinc-900 hover:bg-zinc-700 border-b-2 border-green-500' : 'hover:bg-zinc-800'} flex-grow p-3`}
          onClick={() => handleClick('status')}
        >
          Status
        </button>
      </div>
    </div>
  )
}

export default Tabs

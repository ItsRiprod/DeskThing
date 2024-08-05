import React from 'react'

export interface View {
  id: string
  display: string
}

interface TopbarProps {
  setCurrentView: React.Dispatch<React.SetStateAction<View>>
  currentView: View
  views: View[]
}

const Tabs: React.FC<TopbarProps> = ({ setCurrentView, currentView, views }) => {
  const handleClick = (view: View): void => {
    setCurrentView(view)
  }

  return (
    <div className="w-full top-0 p-0 gap-5 h-fit flex-shrink-0 sm:relative rounded-lg flex overflow-x-scroll items-center">
      <div className="flex justify-evenly w-full border-b-2 border-zinc-800">
        {views.map((view) => (
          <button
            key={view.id}
            className={`${
              currentView.id === view.id
                ? 'bg-zinc-900 hover:bg-zinc-700 border-b-2 border-green-500'
                : 'hover:bg-zinc-800'
            } flex-grow p-3`}
            onClick={() => handleClick(view)}
          >
            {view.display}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Tabs

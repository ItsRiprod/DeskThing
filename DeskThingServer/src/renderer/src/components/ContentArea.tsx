import React from 'react'
import AppsList from './AppsList'
import Status from './Status'
import LogDisplay from './LogDisplay'

type View = 'appsList' | 'status' | 'logDisplay' // Define possible views

interface ContentAreaProps {
  currentView: View
}

const ContentArea: React.FC<ContentAreaProps> = ({ currentView }) => {
  const renderView = (): JSX.Element | undefined => {
    switch (currentView) {
      case 'appsList':
        return <AppsList />
      case 'status':
        return <Status />
      case 'logDisplay':
        return <LogDisplay />
      default:
        return undefined
    }
  }

  return (
    <div className="container grow rounded-lg flex flex-col overflow-y-scroll items-center border-2 border-zinc-800 h-full p-2">
      {renderView()}
    </div>
  )
}

export default ContentArea

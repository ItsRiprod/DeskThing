import React from 'react'
import AppsList from '../pages/Apps'
import Dev from '../pages/Dev'
import Home from '../pages/Home'
import Device from '../pages/Client' // Define possible views
import { SidebarView } from '../App'

interface ContentAreaProps {
  currentView: SidebarView
}

const ContentArea: React.FC<ContentAreaProps> = ({ currentView }) => {
  const renderView = (): JSX.Element | undefined => {
    switch (currentView) {
      case 'home':
        return <Home />
      case 'apps':
        return <AppsList />
      case 'client':
        return <Device />
      case 'dev':
        return <Dev />
      default:
        return undefined
    }
  }

  return (
    <div className="container rounded-lg flex flex-col overflow-y-scroll items-center border-2 border-zinc-800 h-full">
      {renderView()}
    </div>
  )
}

export default ContentArea

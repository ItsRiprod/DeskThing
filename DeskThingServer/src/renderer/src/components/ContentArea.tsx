import React from 'react'
import AppsList from './Apps'
import Dev from './Dev'
import Adb from './ADB'
import Device from './Device'
import LogDisplay from './LogDisplay'

type View = 'appsList' | 'adb' | 'logDisplay' | 'preferences' | 'dev' // Define possible views

interface ContentAreaProps {
  currentView: View
}

const ContentArea: React.FC<ContentAreaProps> = ({ currentView }) => {
  const renderView = (): JSX.Element | undefined => {
    switch (currentView) {
      case 'appsList':
        return <AppsList />
      case 'adb':
        return <Adb />
      case 'logDisplay':
        return <LogDisplay />
      case 'preferences':
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

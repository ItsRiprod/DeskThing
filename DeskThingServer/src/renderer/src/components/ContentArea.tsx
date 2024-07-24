import React from 'react'
import AppsList from './Apps'
import Device from './ADB'
import LogDisplay from './LogDisplay'
import Loading from './Loading'

type View = 'appsList' | 'adb' | 'logDisplay' | 'preferences' // Define possible views

interface ContentAreaProps {
  currentView: View
}

const ContentArea: React.FC<ContentAreaProps> = ({ currentView }) => {
  const renderView = (): JSX.Element | undefined => {
    switch (currentView) {
      case 'appsList':
        return <AppsList />
      case 'adb':
        return <Device />
      case 'logDisplay':
        return <LogDisplay />
      case 'preferences':
        return <Loading message={'Device Preferences not implemented'} />
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

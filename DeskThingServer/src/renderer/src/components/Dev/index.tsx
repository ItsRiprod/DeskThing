import { useState } from 'react'
import Apps from './Apps'
import Adb from './Adb'
import LogDisplay from './LogDisplay'
import Tabs, { View } from '../Tabs'

const index = (): JSX.Element => {
  const views: View[] = [
    { id: 'log', display: 'Logs' },
    { id: 'apps', display: 'Dev Apps' },
    { id: 'adb', display: 'ADB' }
  ]

  const [currentView, setCurrentView] = useState<View>(views[0])
  const renderView = (): JSX.Element | undefined => {
    switch (currentView.id) {
      case 'apps':
        return <Apps />
      case 'adb':
        return <Adb />
      case 'log':
        return <LogDisplay />
      default:
        return undefined
    }
  }

  return (
    <>
      <Tabs currentView={currentView} setCurrentView={setCurrentView} views={views} />
      <div className="w-full h-5/6">{renderView()}</div>
    </>
  )
}

export default index

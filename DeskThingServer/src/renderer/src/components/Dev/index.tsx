import { useState } from 'react'
import Apps from './Apps'
import Adb from '../ADB/Adb'
import Tabs from './Tabs'

export type View = 'apps' | 'adb'

const index = (): JSX.Element => {
  const [currentView, setCurrentView] = useState<View>('apps')
  const renderView = (): JSX.Element | undefined => {
    switch (currentView) {
      case 'apps':
        return <Apps />
      case 'adb':
        return <Adb />
      default:
        return undefined
    }
  }

  return (
    <>
      <Tabs currentView={currentView} setCurrentView={setCurrentView} />
      <div className="w-full h-full">{renderView()}</div>
    </>
  )
}

export default index

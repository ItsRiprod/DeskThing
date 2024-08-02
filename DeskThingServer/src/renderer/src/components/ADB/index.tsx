import { useState } from 'react'
import Tabs from './Tabs'
import Devices from './Devices'
import Adb from './Adb'

export type View = 'devices' | 'adb'

const Index = (): JSX.Element => {
  const [currentView, setCurrentView] = useState<View>('devices')
  const renderView = (): JSX.Element | undefined => {
    switch (currentView) {
      case 'devices':
        return <Devices />
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

export default Index

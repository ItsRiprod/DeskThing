import { useState } from 'react'
import Apps from './Apps'
import Local from './Local'
import Tabs from './Tabs'
import Web from './Web'

export type View = 'apps' | 'local' | 'web'

const index = (): JSX.Element => {
  const [currentView, setCurrentView] = useState<View>('apps')
  const renderView = (): JSX.Element | undefined => {
    switch (currentView) {
      case 'apps':
        return <Apps />
      case 'local':
        return <Local />
      case 'web':
        return <Web />
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

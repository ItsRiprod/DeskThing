import { useEffect, useState } from 'react'
import { IconCarThing } from '../icons'
import Tabs from './Tabs'

export type View = 'devices' | 'webapps'

const Status = (): JSX.Element => {
  const [currentView, setCurrentView] = useState<View>('devices')

  useEffect(() => {
    console.log('apps list in AppsList: ')
  }, [])

  const handlePush = async (): Promise<void> => {
    const response = await window.electron.runAdbCommand(`devices`)
    console.log(response)
  }

  return (
    <>
      <Tabs currentView={currentView} setCurrentView={setCurrentView} />
      <div className="pt-5 flex-col justify-center">
        <IconCarThing
          iconSize={350}
          fontSize={70}
          text={'Status: Unimplemented'}
          highlighted={[]}
          highlightColor="yellow"
        />
        <p>
          No but actually, this hasn&apos;t been implemented yet. <br /> Stop waiting for it to
          connect
        </p>
        <button className="bg-gray-500 p-5 rounded-2xl hover:bg-gray-700" onClick={handlePush}>
          Check devices
        </button>
      </div>
    </>
  )
}

export default Status


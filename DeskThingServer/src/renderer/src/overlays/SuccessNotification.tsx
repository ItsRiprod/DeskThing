import { AppReturnData } from '@shared/types'
import Overlay from './Overlay'
import Button from '@renderer/components/Button'
import { IconPlay } from '@renderer/assets/icons'
import { useState } from 'react'

interface SuccessNotificationProps {
  appReturnData: AppReturnData
  setAppReturnData: (data: null) => void
  runApp: (appId: string) => void
}

export function SuccessNotification({
  appReturnData,
  setAppReturnData,
  runApp
}: SuccessNotificationProps): JSX.Element {
  const [loading, setLoading] = useState(false)

  if (!appReturnData) return <></>

  const onRunClick = async (): Promise<void> => {
    setLoading(true)
    setTimeout(() => {
      setAppReturnData(null)
      runApp(appReturnData.appId)
    }, 500)
  }

  const onClose = (): void => {
    runApp(appReturnData.appId)
    setAppReturnData(null)
  }

  return (
    <Overlay onClose={onClose} className="border bg-zinc-950 border-zinc-800 flex flex-col">
      <div className="w-full py-4 bg-zinc-900 px-5 border-b border-gray-500">
        <h1 className="text-2xl text-green-500 pr-24">Successfully Downloaded</h1>
      </div>
      <div className="p-5 flex flex-col gap-2">
        <div>
          <p>{appReturnData.appName} is installed</p>
          <p>v{appReturnData.appVersion}</p>
        </div>
        <Button
          className="hover:bg-zinc-700 relative flex gap-2 w-full bg-black border border-zinc-900"
          onClick={onRunClick}
          disabled={loading}
        >
          <IconPlay
            className={`fill-white absolute duration-500 inset transition-all ${loading ? 'left-1/2 opacity-0' : 'left-4'}`}
          />
          <p className={`${loading ? 'opacity-0' : ''} transition-all ml-10`}>Initialize App</p>
        </Button>
      </div>
    </Overlay>
  )
}

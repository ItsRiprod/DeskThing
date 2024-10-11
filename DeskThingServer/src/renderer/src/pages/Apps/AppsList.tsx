import React from 'react'
import Sidebar from '@renderer/components/SideBar'
import Button from '@renderer/components/Button'
import { IconBell, IconDownload } from '@renderer/assets/icons'
import { useAppStore } from '@renderer/stores'
import App from '@renderer/components/App'

const AppsList: React.FC = () => {
  const appsList = useAppStore((appStore) => appStore.appsList)

  return (
    <div className="flex h-full w-full">
      <Sidebar className="flex justify-end flex-col h-full max-h-full md:items-stretch items-center">
        <div className="flex flex-col gap-2">
          <Button>
            <IconDownload strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Download</p>
          </Button>
        </div>
      </Sidebar>
      <div className="flex-1 relative p-6 w-full max-h-full overflow-y-auto">
        <div className="absolute top-0 p-5 left-0 w-full h-full">
          {appsList ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {appsList.map((app, index) => (
                <App key={index} app={app} />
              ))}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppsList

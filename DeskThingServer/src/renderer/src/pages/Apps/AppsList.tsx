import React from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import { IconDownload } from '@renderer/assets/icons'
import { useAppStore, usePageStore } from '@renderer/stores'
import App from '@renderer/components/App'
import MainElement from '@renderer/nav/MainElement'

const AppsList: React.FC = () => {
  const appsList = useAppStore((appStore) => appStore.appsList)
  const setPage = usePageStore((pageStore) => pageStore.setPage)

  const handleDownloadsNav = (): void => {
    setPage('Downloads/App')
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar className="flex justify-end flex-col h-full max-h-full md:items-stretch items-center">
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownloadsNav}>
            <IconDownload strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Download</p>
          </Button>
        </div>
      </Sidebar>
      <MainElement className="relative">
        <div className="absolute top-0 p-5 left-0 w-full h-full">
          {appsList ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {appsList.map((app, index) => (
                <App key={index} app={app} />
              ))}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </MainElement>
    </div>
  )
}

export default AppsList

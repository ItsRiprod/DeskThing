import React, { useEffect, useMemo, useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import { IconDownload, IconLink } from '@renderer/assets/icons'
import { useAppStore, useNotificationStore, usePageStore } from '@renderer/stores'
import App from '@renderer/components/App'
import MainElement from '@renderer/nav/MainElement'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { ProgressChannel } from '@shared/types'

/**
 * The `AppsList` component is the main component that renders the list of installed apps in the application.
 * It fetches the list of apps from the app store, displays them in a scrollable list, and allows the user to
 * reorder the apps by dragging and dropping them.
 *
 * The component also includes a sidebar with a button to navigate to the downloads page.
 */
const AppsList: React.FC = () => {
  useChannelProgress(ProgressChannel.IPC_APPS)
  const appsList = useAppStore((appStore) => appStore.appsList)
  const order = useAppStore((appStore) => appStore.order)
  const setOrder = useAppStore((appStore) => appStore.setOrder)
  const setPage = usePageStore((pageStore) => pageStore.setPage)
  const requests = useNotificationStore((notificationStore) => notificationStore.requestQueue)
  const [activeRequests, setActiveRequests] = useState<string[]>([])
  const [draggedAppHeight, setDraggedAppHeight] = useState<number>(0)

  const [draggedApp, setDraggedApp] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDownloadsNav = (): void => {
    setPage('Downloads/App')
  }

  const apps = useMemo(() => {
    return order.map((appName) => appsList.find((app) => app.name === appName)).filter(Boolean)
  }, [order, appsList])

  useEffect(() => {
    setActiveRequests(requests.map((request) => request.appName))
  }, [requests])

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, appName: string): void => {
    setDraggedApp(appName)
    setDraggedAppHeight(e.currentTarget.clientHeight)
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '1'
    dragImage.style.position = 'fixed'
    dragImage.style.top = '-1000px'
    dragImage.style.width = `${e.currentTarget.offsetWidth}px`
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)

    // Clean up the drag image after dragging
    requestAnimationFrame(() => {
      document.body.removeChild(dragImage)
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number): void => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = (): void => {
    setDragOverIndex(null)
  }

  const handleDrop = (targetAppName: string): void => {
    if (draggedApp && draggedApp !== targetAppName) {
      const newOrder = [...order]
      const draggedIndex = newOrder.indexOf(draggedApp)
      const targetIndex = newOrder.indexOf(targetAppName)
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedApp)
      setOrder(newOrder)
    }
    setDraggedApp(null)
    setDragOverIndex(null)
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar className="justify-end md:items-stretch xs:items-center">
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownloadsNav}>
            <IconDownload strokeWidth={1.5} />
            <p className="xs:hidden md:block block text-center flex-grow">Download</p>
          </Button>
        </div>
      </Sidebar>
      <MainElement className="relative">
        <div className="absolute inset-0 top-0 p-5 pb-10 left-0 w-full h-full">
          {apps ? (
            apps.length > 0 ? (
              <div className="flex flex-col gap-2">
                {apps.map(
                  (app, index) =>
                    app && (
                      <div
                        key={app.name}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.name)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(app.name)}
                        className={`relative transition-all duration-75
                        ${draggedApp === app.name ? 'opacity-50' : ''}`}
                      >
                        <div
                          style={{
                            height:
                              index !== order.length - 1 && dragOverIndex === index
                                ? draggedAppHeight + 'px'
                                : '0px'
                          }}
                          className={`rounded-lg bg-zinc-950 transition-all ${dragOverIndex === index ? 'mb-2' : ''}`}
                        />
                        <App app={app} activeRequest={activeRequests.includes(app.name)} />
                        {index === order.length - 1 && dragOverIndex === index && (
                          <div className="h-[100px]"></div>
                        )}
                      </div>
                    )
                )}
              </div>
            ) : (
              // Shows when the AppsList is initialized but empty
              <div className="w-full h-full flex flex-col justify-center items-center gap-2">
                <p>No apps downloaded yet!</p>
                <Button
                  onClick={handleDownloadsNav}
                  className="bg-zinc-900 gap-2 hover:bg-zinc-800"
                >
                  <p className="md:block hidden text-center flex-grow">Downloads Page</p>
                  <IconLink strokeWidth={1.5} />
                </Button>
              </div>
            )
          ) : (
            // Shows while retrieving the apps list from the store
            <p>Loading...</p>
          )}
        </div>
      </MainElement>
    </div>
  )
}

export default AppsList

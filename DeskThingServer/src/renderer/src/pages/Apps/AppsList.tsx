import React, { useEffect, useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import { IconDownload, IconLink } from '@renderer/assets/icons'
import { useAppStore, useNotificationStore, usePageStore } from '@renderer/stores'
import App from '@renderer/components/App'
import MainElement from '@renderer/nav/MainElement'

/**
 * The `AppsList` component is the main component that renders the list of installed apps in the application.
 * It fetches the list of apps from the app store, displays them in a scrollable list, and allows the user to
 * reorder the apps by dragging and dropping them.
 *
 * The component also includes a sidebar with a button to navigate to the downloads page.
 */
const AppsList: React.FC = () => {
  const appsList = useAppStore((appStore) => appStore.appsList)
  const order = useAppStore((appStore) => appStore.order)
  const setOrder = useAppStore((appStore) => appStore.setOrder)
  const setPage = usePageStore((pageStore) => pageStore.setPage)
  const requests = useNotificationStore((notificationStore) => notificationStore.requestQueue)
  const [activeRequests, setActiveRequests] = useState<string[]>([])

  const [draggedApp, setDraggedApp] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDownloadsNav = (): void => {
    setPage('Downloads/App')
  }

  useEffect(() => {
    setActiveRequests(requests.map((request) => request.appName))
  }, [requests])

  const handleDragStart = (e, appName: string): void => {
    setDraggedApp(appName)

    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)

    // Add a class to the dragged element
    e.currentTarget.classList.add('dragging')

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
        <div className="absolute top-0 p-5 left-0 w-full h-full">
          {appsList ? (
            appsList.length > 0 ? (
              <div className="flex flex-col gap-4">
                {order.map((appName, index) => {
                  const app = appsList.find((a) => a.name === appName)
                  if (!app) return null
                  return (
                    <div
                      key={app.name}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.name)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(app.name)}
                      className={`relative ${
                        dragOverIndex === index ? 'border-t-2 border-zinc-500' : ''
                      }`}
                    >
                      <App app={app} activeRequest={activeRequests.includes(app.name)} />
                      {index === order.length - 1 && dragOverIndex === index && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500"></div>
                      )}
                    </div>
                  )
                })}
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

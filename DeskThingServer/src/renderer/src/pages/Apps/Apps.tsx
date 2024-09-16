import { useEffect, useRef, useState } from 'react'
import { useAppStore, App } from '../../store/appStore'
import DisplayAppData from '../../overlays/DisplayAppData'
import AppSettingsOverlay from '../../overlays/AppSettingsOverlay'
import AppComponent from '../../components/AppComponent'
export type View = 'apps' | 'local' | 'web'

const Apps = (): JSX.Element => {
  const { appsList, setAppList } = useAppStore()
  const [enabled, setEnabled] = useState(false)
  const [sEnabled, setSEnabled] = useState(false)
  const [appIndex, setAppIndex] = useState(1)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const requestAppsList = (): void => window.electron.ipcRenderer.send('get-apps')

  useEffect(() => {
    requestAppsList()
  }, [])

  const handleDragStart = (index: number) => {
    dragItem.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index
  }

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const copyListItems = [...appsList]
      const dragItemContent = copyListItems[dragItem.current]
      copyListItems.splice(dragItem.current, 1)
      copyListItems.splice(dragOverItem.current, 0, dragItemContent)
      dragItem.current = null
      dragOverItem.current = null
      setAppList(copyListItems)
    }
  }

  return (
    <div className="h-vh w-[100%] flex flex-col justify-between items-center">
      <div className="pt-5 w-full flex justify-center">
        {enabled && <DisplayAppData appIndex={appIndex} setEnabled={setEnabled} data={appsList} />}
        {sEnabled && (
          <AppSettingsOverlay appIndex={appIndex} setEnabled={setSEnabled} data={appsList} />
        )}
        {appsList?.length > 0 && Object.keys(appsList).length > 0 ? (
          <div className="pt-5 w-full flex xl:flex-row xl:flex-wrap xl:gap-5 xl:px-5 flex-col items-center gap-2">
            {(appsList as App[]).map((app, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="w-full"
              >
                <AppComponent
                  appIndex={index}
                  app={app}
                  setSEnabled={setSEnabled}
                  setEnabled={setEnabled}
                  setAppIndex={setAppIndex}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-zinc-200 p-5 w-[90%] h-fit flex flex-col items-center gap-5 justify-center rounded-3xl shadow-lg px-5 align-baseline">
            <button
              className="border-2 border-cyan-600 hover:bg-cyan-500 bg-cyan-600  p-2 rounded-lg"
              onClick={() => requestAppsList()}
            >
              Refresh Apps List
            </button>
            <p className="italic text-gray-500">Are any downloaded?</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Apps

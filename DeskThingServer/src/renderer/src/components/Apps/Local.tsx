import { DragEvent, useState } from 'react'
import { IconLogoGearLoading, IconUpload } from '../icons'

interface returnData {
  appId: string
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
}

const index = (): JSX.Element => {
  const [appData, setAppData] = useState<returnData | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    setDragActive(false)
    setLoading(true)
    console.log('App Dropped')

    const files = Array.from(event.dataTransfer.files)
    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        await handleZipFile(file.path)
      }
    }
  }
  async function handleZipFile(zipFilePath: string): Promise<void> {
    try {
      // Notify the main process to handle the zip file
      window.electron.ipcRenderer.send('handle-zip', zipFilePath)
      window.electron.ipcRenderer.once('zip-name', (_event, data: returnData) => {
        console.log('Received appId:', data)
        setAppData(data)
        setLoading(false)
      })
    } catch (error) {
      console.error('Error handling zip file:', error)
    }
  }

  const handleAddAndRunApp = async (): Promise<void> => {
    window.electron.ipcRenderer.send('add-app', appData?.appId)
    window.electron.ipcRenderer.send('get-apps')
    setAppData(null)
  }

  const handleClick = async (): Promise<void> => {
    const file = await window.electron.selectZipFile()
    if (file) {
      setLoading(true)
      await handleZipFile(file.path)
      console.log(file.name)
    }
  }

  return (
    <div className="w-full flex items-center justify-center">
      {appData?.appId ? (
        <div className="border-2 border-zinc-200 p-5 w-52 md:w-11/12 2xl:w-96 h-fit flex-col justify-between rounded-3xl shadow-lg px-5 items-center">
          <p className="text-xl pb-4">{appData.appName} is Ready!</p>
          <div className="flex gap-5">
            <p className="text-sm pb-4">{appData.appVersion}</p>
            <p className="text-sm pb-4">Author: {appData.author || 'not provided'}</p>
          </div>
          <p className="text-sm pb-4">Compatible With: {appData.platforms.join(', ')}</p>
          {appData.requirements.length > 0 && (
            <p className="text-sm pb-4">Required Apps: {appData.requirements.join(', ')}</p>
          )}
          <button
            onClick={handleAddAndRunApp}
            className="border-2 border-cyan-600 hover:bg-cyan-500 bg-cyan-600  p-2 rounded-lg"
          >
            Run {appData.appId}
          </button>
        </div>
      ) : (
        <div
          className={`p-10 rounded-3xl flex flex-col items-center hover:bg-zinc-800 border-2 sm:w-30 md:w-96 md:text-2xl 2xl:w-auto 2xl:text-3xl border-zinc-200 transition-colors ${dragActive ? 'drag-active' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onClick={handleClick}
        >
          {loading ? (
            <div className="flex flex-col items-center">
              <IconLogoGearLoading iconSize={100} />
            </div>
          ) : (
            <>
              <IconUpload iconSize={100} />
              <p>Drop your .zip App file here</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default index

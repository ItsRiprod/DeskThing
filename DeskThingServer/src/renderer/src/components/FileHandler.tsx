import { DragEvent, useState } from 'react'
import { IconUpload } from './icons'

const FileHandler = (): JSX.Element => {
  const [fileName, setFileName] = useState('')
  const handleDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        await handleZipFile(file.path)
        setFileName(file.name.replace('.zip', ''))
      }
    }
  }
  async function handleZipFile(zipFilePath: string): Promise<void> {
    try {
      // Notify the main process to handle the zip file
      window.electron.ipcRenderer.send('handle-zip', zipFilePath)
    } catch (error) {
      console.error('Error handling zip file:', error)
    }
  }

  const handleAddAndRunApp = async (): Promise<void> => {
    window.electron.ipcRenderer.send('add-app', fileName)
    window.electron.ipcRenderer.send('get-apps')
    setFileName('')
  }

  const handleClick = async (): Promise<void> => {
    const file = await window.electron.selectZipFile()
    if (file) {
      await handleZipFile(file.path)
      console.log(file.name)
      if (file.name.endsWith('.zip')) {
        setFileName(file.name.replace('.zip', ''))
      } else {
        setFileName(file.name)
      }
    }
  }

  return (
    <>
      {fileName ? (
        <div className="p-10 rounded-3xl border-2 border-zinc-200 transition-colors">
          <p className="text-xl pb-4">App Ready!</p>
          <button
            onClick={handleAddAndRunApp}
            className="border-2 border-cyan-600 hover:bg-cyan-500 bg-cyan-600  p-2 rounded-lg"
          >
            Run {fileName}
          </button>
        </div>
      ) : (
        <div
          className="p-10 rounded-3xl flex flex-col items-center hover:bg-zinc-800 border-2 sm:w-30 md:w-96 md:text-2xl 2xl:w-auto 2xl:text-3xl border-zinc-200 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleClick}
        >
          <IconUpload iconSize={100} />
          <p>Drop your .zip App file here</p>
        </div>
      )}
    </>
  )
}

export default FileHandler

import { DragEvent } from 'react'
import { useAppStore } from '../store/appStore'

const FileHandler = (): JSX.Element => {
  const { addAppToList } = useAppStore()

  const handleDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        await handleZipFile(file.path)
        addAppToList(file.name)
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

  return (
    <div
      className="bg-zinc-500 p-10 rounded-3xl hover:bg-zinc-400 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      Drop your .zip App file here
    </div>
  )
}

export default FileHandler

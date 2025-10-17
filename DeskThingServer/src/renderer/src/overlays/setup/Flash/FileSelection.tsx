import { FC, useState } from 'react'
import { IconUpload, IconLoading, IconConfig } from '@renderer/assets/icons'
import useFlashStore from '@renderer/stores/flashStore'
import Button from '@renderer/components/buttons/Button'

export const FileSelection: FC = () => {
  const [selectingFile, setSelectingFile] = useState(false)
  const [loading, setLoading] = useState(false)
  const uploadFirmware = useFlashStore((state) => state.uploadFirmware)
  const getAvailableStagedFiles = useFlashStore((state) => state.getAvailableStagedFiles)
  const setStagedFile = useFlashStore((state) => state.selectStagedFile)
  const [existingFiles, setExistingFiles] = useState<string[]>([])

  const [result, setResult] = useState<string | undefined>()

  const handleUploadClick = async (): Promise<void> => {
    setSelectingFile(true)
    setLoading(true)
    const result = await window.electron.utility.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Compressed Files',
          extensions: ['zip', 'tar', 'gz', '7z', 'rar']
        }
      ]
    })
    setSelectingFile(false)
    setLoading(false)
    if (!result.canceled && result.filePaths?.length > 0) {
      setLoading(true)
      try {
        await uploadFirmware(result.filePaths[0])
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }
  }

  const handleFetchFiles = async (): Promise<void> => {
    setLoading(true)
    setResult(undefined)
    const files = await getAvailableStagedFiles()
    setExistingFiles(files)
    setLoading(false)
  }

  const handleFileSelection = async (fileName: string): Promise<void> => {
    setLoading(true)
    const result = await setStagedFile(fileName)
    setLoading(false)
    setExistingFiles([])
    setResult(result)
  }

  return (
    <div className="mb-4 flex flex-col justify-center items-center gap-4">
            <div className="w-full flex justify-center">
            <h1 className="text-xl">Upload Local Firmware</h1>
            </div>
      <div className="flex justify-center gap-2">
        <Button
          onClick={handleUploadClick}
          className="bg-green-600 hover:bg-green-500 h-fit text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
          disabled={loading}
        >
          {selectingFile ? (
            <IconLoading className="w-5 h-5 mr-2" strokeWidth={1.5} />
          ) : (
            <IconUpload className="w-5 h-5 mr-2" strokeWidth={1.5} />
          )}
          Upload Local File
        </Button>
        {existingFiles.length > 0 ? (
          <div>
            {existingFiles.map((file, index) => (
              <div key={index}>
                <Button
                  onClick={() => handleFileSelection(file)}
                  className="w-full justify-between text-left p-4 rounded-lg transition-all hover:transform hover:scale-[1.02] border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700/50"
                >
                  <div className="flex justify-between items-start flex-col">
                    <p className="font-semibold text-sm text-white">{file}</p>
                  </div>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <Button
              onClick={handleFetchFiles}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
              disabled={loading}
            >
              {selectingFile ? (
                <IconLoading className="w-5 h-5 mr-2" strokeWidth={1.5} />
              ) : (
                <IconConfig className="w-5 h-5 mr-2" strokeWidth={1.5} />
              )}
              Choose Existing File
            </Button>
          </div>
        )}
      </div>
      {result && <p>{result}</p>}
    </div>
  )
}

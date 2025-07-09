import { useEffect, useState } from 'react'
import useFlashStore from '@renderer/stores/flashStore'
import {
  ThingifyApiFirmware,
  ThingifyApiVersion,
  ThingifyArchiveDownloadResult
} from '@shared/types'
import Button from '@renderer/components/Button'
import { IconLoading, IconTrash } from '@renderer/assets/icons'
import { LogEntry } from '@renderer/components/LogEntry'

export const ThingifyTools = (): JSX.Element => {
  const [firmware, setFirmware] = useState<ThingifyApiFirmware | null>(null)
  const [versions, setVersions] = useState<ThingifyApiVersion | null>(null)
  const [selectedFirmwareId, setSelectedFirmwareId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [downloadResults, setDownloadResults] = useState<ThingifyArchiveDownloadResult | null>(null)

  const recommendedFileId = 'iMktiQXVP4mC5lCe3WRQy'
  const recommendedFirmwareId = 'Sn_vBLpPfJjic6DZtCj6k'

  const getFirmware = useFlashStore((state) => state.getFirmware)
  const getVersions = useFlashStore((state) => state.getVersions)
  const downloadFirmware = useFlashStore((state) => state.downloadFirmware)
  const downloadProgress = useFlashStore((state) => state.downloadProgress)
  const clearDownload = useFlashStore((state) => state.clearDownload)

  useEffect(() => {
    if (firmware == null) {
      loadFirmwareOptions()
    }
  }, [firmware, getFirmware])

  const loadFirmwareOptions = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const firmwareOptions = await getFirmware()
      setFirmware(firmwareOptions)
    } finally {
      setIsLoading(false)
    }
  }

  const loadVersions = async (firmwareId: string): Promise<void> => {
    try {
      setIsLoading(true)
      const versionOptions = await getVersions(firmwareId)
      setVersions(versionOptions)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFirmwareSelect = (firmwareId: string): void => {
    setSelectedFirmwareId(firmwareId)
    setDownloadResults(null)

    loadVersions(firmwareId)
  }

  const handleVersionDownload = async (version: string, file: string): Promise<void> => {
    setIsLoading(true)
    setDownloadResults(null)
    clearDownload()
    const downloadResults = await downloadFirmware(version, file)
    setDownloadResults(downloadResults)
    console.log(downloadResults)
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full flex justify-center">
        <h1 className="text-xl">Download from ThingifyTools</h1>
      </div>
      {downloadProgress ? (
        <div className="flex w-full">
          <LogEntry progressEvent={downloadProgress} className="w-full" />
          {downloadProgress.progress == 100 && (
            <Button className="text-left gap-2" onClick={clearDownload}>
              <IconTrash iconSize={48} className="transition-colors group-hover:text-red-500" />
              <p className="group-hover:font-normal">Download Different Firmware</p>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg p-4 border border-zinc-700">
            <h3 className="text-base font-semibold text-white mb-3">Available Versions</h3>
            <div className="space-y-2 flex flex-col-reverse">
              {firmware?.versions?.map((fw) => (
                <Button
                  key={fw.id}
                  onClick={() => handleFirmwareSelect(fw.id)}
                  className={`w-full justify-between text-left p-4 rounded-lg transition-all hover:transform hover:scale-[1.02] ${
                    selectedFirmwareId === fw.id
                      ? 'bg-green-500/10 border-green-500 shadow-lg shadow-green-500/30'
                      : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start flex-col ">
                    <p className="font-semibold text-sm text-white">{fw.version}</p>
                    {fw.id == recommendedFirmwareId && (
                      <p className="font-semibold text-xs max-h-fit bg-emerald-700 rounded-lg px-2 text-white">
                        Recommended
                      </p>
                    )}
                  </div>

                  <div className="text-xs mt-2 text-zinc-400 flex items-center gap-1">
                    <span className="text-xs text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded-full">
                      {new Date(fw.createdAt || 0).toLocaleDateString()}
                    </span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                      />
                    </svg>
                    {fw.downloadCount.toLocaleString()} downloads
                  </div>
                </Button>
              ))}
            </div>
          </div>
          {versions && (
            <div className="rounded-lg p-6 border border-zinc-700">
              <h3 className="text-lg font-semibold text-white mb-4">Version Details</h3>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Changelog</h4>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {versions?.changelog}
                </p>
              </div>
              <div className="space-y-3">
                {versions?.files.map((file) => (
                  <div
                    key={file.id}
                    className="relative bg-zinc-900/50 hover:bg-zinc-800/50 rounded-lg p-4 border border-zinc-600 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium mb-1">{file.fileName}</p>
                        <div className="flex gap-2">
                          <p className="text-xs text-zinc-300">
                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {file.id == recommendedFileId && (
                            <p className="font-semibold text-xs max-h-fit bg-emerald-700 rounded-lg px-2 text-white">
                              Recommended
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        disabled={isLoading}
                        onClick={() => handleVersionDownload(versions.id, file.id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
                      >
                        {isLoading ? <IconLoading /> : 'Download'}
                      </Button>
                    </div>
                  </div>
                ))}
                {downloadResults &&
                  (downloadResults.status ? (
                    <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                      <p className="text-emerald-400 text-sm font-medium">
                        {downloadResults.statusText}
                      </p>
                      <p className="text-emerald-300/80 text-xs mt-1">
                        {downloadResults.operationText}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg shadow-lg">
                      <p className="text-red-400 text-sm font-semibold mb-2">
                        {downloadResults.statusText}
                      </p>
                      <p className="text-red-300/90 text-xs leading-relaxed">
                        {downloadResults.operationText}
                      </p>
                      <p className="text-red-300/90 text-xs mt-3">
                        Having trouble? Join the{' '}
                        <a
                          href={'https://deskthing.app/discord'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-400 hover:text-red-300 underline transition-colors duration-200"
                        >
                          DeskThing Discord Server
                        </a>{' '}
                        and check the{' '}
                        <a
                          href={
                            'https://canary.discord.com/channels/1267348109067817051/1292217043881299999'
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                        >
                          #resources
                        </a>{' '}
                        channel!
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

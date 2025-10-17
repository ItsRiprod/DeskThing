import { IconArrowRight, IconArrowUp, IconX, IconCopy } from '@renderer/assets/icons'
import Button from '@renderer/components/buttons/Button'
import useSettingsStore from '@renderer/stores/settingsStore'
import { LinkRequest } from '@shared/types'
import { FC, useRef, useState } from 'react'

const LinkRequestOverlay: FC = () => {
  const activeRequests = useSettingsStore((state) => state.activeRequests)
  const resolveRequest = useSettingsStore((state) => state.resolveRequest)
  const clearRequests = useSettingsStore((state) => state.clearRequests)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [expand, setIsExpanded] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const onClose = (): void => {
    clearRequests()
  }

  const handleOpenLink = (request: LinkRequest): void => {
    resolveRequest(request)
  }

  const handleIgnore = (request: LinkRequest): void => {
    resolveRequest(request, true)
  }

  const toggleExpand = (): void => {
    setIsExpanded((prev) => !prev)
  }

  const copyToClipboard = (text: string, index: number): void => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1200)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        ref={overlayRef}
        className={`border hover:z-50 border-gray-500 w-96 h-[50vh] flex flex-col overflow-hidden rounded-lg shadow-2xl bg-zinc-950 transition-all duration-200 ${expand ? '' : 'h-20'}`}
      >
        <div className="w-full py-4 bg-zinc-900 px-5 flex items-center justify-between border-b border-gray-700">
          <Button className="hover:bg-zinc-950/50" onClick={toggleExpand}>
            <IconArrowUp
              className={`${expand ? 'rotate-180' : 'animate-pulse'} transition-transform duration-200`}
            />
          </Button>
          <h2 className="text-xl font-semibold text-white">Pending Link Requests</h2>
          <Button className="hover:bg-red-950" onClick={onClose}>
            <IconX />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-4">
          <div className="flex flex-col gap-4 h-full">
            {activeRequests.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-gray-400">No pending link requests.</p>
              </div>
            ) : (
              activeRequests.map((request, index) => (
                <div
                  key={index}
                  className="relative bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow flex flex-col gap-2"
                >
                  <p className="font-semibold text-white text-base mb-1">
                    <span className="text-emerald-500">
                      {request.app.charAt(0).toUpperCase() + request.app.slice(1)}
                    </span>{' '}
                    is requesting access to:
                  </p>
                  <a
                    href={request.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-blue-500 hover:underline break-all mb-2"
                  >
                    {request.url}
                  </a>
                  <div className="flex justify-end gap-2">
                    <Button
                      title="Ignore"
                      onClick={() => handleIgnore(request)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-gray-200"
                    >
                      Ignore
                    </Button>
                    <Button
                      title="Copy Link"
                      onClick={() => copyToClipboard(request.url, index)}
                      className="hover:bg-zinc-800 relative"
                    >
                      <IconCopy className="mr-1" />
                      Copy
                      {copiedIndex === index && (
                        <span className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center bg-black/80 rounded text-green-400 font-semibold text-xs animate-fade-in">
                          Copied successfully!
                        </span>
                      )}
                    </Button>
                    <Button
                      title="Open Link"
                      onClick={() => handleOpenLink(request)}
                      className="hover:bg-blue-900 text-blue-300 flex items-center gap-1"
                    >
                      Open
                      <IconArrowRight />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LinkRequestOverlay

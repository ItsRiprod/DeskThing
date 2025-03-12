import { IconArrowRight, IconArrowUp, IconX } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import useSettingsStore from '@renderer/stores/settingsStore'
import { LinkRequest } from '@shared/types'
import { FC, useRef, useState } from 'react'

const LinkRequestOverlay: FC = () => {
  const activeRequests = useSettingsStore((state) => state.activeRequests)
  const resolveRequest = useSettingsStore((state) => state.resolveRequest)
  const clearRequests = useSettingsStore((state) => state.clearRequests)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [expand, setIsExpanded] = useState(true)

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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        ref={overlayRef}
        className={`border ${expand ? 'h-[50vh]' : 'h-20'} transition-[height] border-zinc-700 bg-zinc-900 rounded-lg shadow-lg w-96`}
      >
        <div className="flex flex-col gap-4 p-4 h-full">
          <div className="flex justify-between items-center">
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

          <div className="relative w-full h-full overflow-y-auto">
            <div className="flex flex-col absolute inset-0 w-full h-full overflow-y-auto gap-4">
              {activeRequests.map((request, index) => (
                <div key={index} className="bg-zinc-800 p-3 rounded-lg">
                  <p className="font-semibold text-white max-w-full overflow-hidden text-ellipsis mb-2 text-nowrap">
                    {request.app} is requesting access to:
                  </p>
                  <p className="text-white max-w-full overflow-hidden text-ellipsis mb-2 text-nowrap">
                    {request.url}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      title="Ignore"
                      onClick={() => handleIgnore(request)}
                      className="bg-zinc-700 hover:bg-zinc-600"
                    >
                      Ignore
                    </Button>
                    <Button
                      title="Open Link"
                      onClick={() => handleOpenLink(request)}
                      className="hover:bg-zinc-800"
                    >
                      Open Link
                      <IconArrowRight />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LinkRequestOverlay

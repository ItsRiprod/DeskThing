import { IconArrowDown, IconCheck, IconX } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useNotificationStore } from '@renderer/stores'
import { Request } from '@renderer/stores/notificationStore'
import React, { useState, useEffect } from 'react'

const RequestsPage: React.FC = () => {
  const requests = useNotificationStore((state) => state.requestQueue)

  useEffect(() => {
    console.log('Current Requests: ', requests)
  }, [requests])

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">App Requests</h1>
      <div className="bg-red-950 px-4 py-1 rounded-lg shadow-lg my-2">
        <p className="text-xs italic text-gray-300">
          Requests will be depreciated in a future release
        </p>
      </div>
      <div className="w-full h-full relative overflow-y-auto">
        {requests.length > 0 ? (
          <div className="w-full h-full overflow-y-auto relative">
            <div className="w-full h-full gap-2 flex flex-col absolute inset-0">
              {requests.map((request, index) => (
                <RequestComponent key={index} request={request} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No active requests.</p>
        )}
      </div>
    </div>
  )
}

interface RequestProps {
  request: Request
}

const RequestComponent = ({ request }: RequestProps): React.ReactElement => {
  const resolveRequest = useNotificationStore((state) => state.resolveRequest)
  const [expanded, setIsExpanded] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [allFieldsFilled, setAllFieldsFilled] = useState(false)

  const handleInputChange = (field: string, value: string): void => {
    setFormData({
      ...formData,
      [field]: value || ''
    })
  }

  useEffect(() => {
    const initialFormData = Object.entries(request.scopes).reduce(
      (acc, [key, scope]) => {
        acc[key] = scope.value || ''
        return acc
      },
      {} as { [key: string]: string }
    )
    setFormData(initialFormData)
  }, [request.scopes])

  const resolveRequestWithData = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault()
    console.log('Form Data:', request.appName, formData)
    resolveRequest(request.appName, formData)
  }

  const toggleExpanded = (): void => {
    setIsExpanded(!expanded)
    setFocusedIndex(0)
  }

  useEffect(() => {
    const allFilled = Object.keys(request.scopes).every(
      (key) => formData[key] && formData[key].trim() !== ''
    )
    setAllFieldsFilled(allFilled)
  }, [formData, request.scopes])

  return (
    <div className="rounded bg-zinc-900 p-2 flex flex-col">
      <div className="flex w-full justify-between items-center p-2">
        <p className="text-2xl font-semibold">
          {request.appName.charAt(0).toUpperCase() + request.appName.slice(1)} Request
        </p>
        <div className="flex">
          <Button className="group hover:bg-black bg-zinc-900" onClick={toggleExpanded}>
            <IconArrowDown
              className={`stroke-2 transition-transform duration-500 ${expanded ? '-scale-y-100' : ''}`}
              iconSize={32}
            />
          </Button>
        </div>
      </div>
      {expanded && (
        <form className="flex flex-col items-center" onSubmit={(e) => e.preventDefault()}>
          {Object.entries(request.scopes).map(([key, scope], index) => (
            <div key={index} className="mb-2 group w-full">
              <div className="flex p-2">
                <label htmlFor={key} className="w-1/2 text-nowrap">
                  {scope.label}
                </label>
                <input
                  type="text"
                  id={key}
                  value={formData[key] || scope.value || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-full group border rounded px-2 py-1 focus:text-black text-gray-500"
                  onFocus={() => setFocusedIndex(index)}
                />
              </div>
              {focusedIndex == index && (
                <div
                  className="text-gray-500"
                  dangerouslySetInnerHTML={{ __html: `${scope.instructions}` }}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end w-full">
            <Button
              onClick={(e) => resolveRequestWithData(e)}
              disabled={!allFieldsFilled}
              className="group hover:bg-zinc-950"
            >
              {allFieldsFilled ? <IconCheck /> : <IconX />}
              <p className="group-hover:block hidden">Submit</p>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
export default RequestsPage

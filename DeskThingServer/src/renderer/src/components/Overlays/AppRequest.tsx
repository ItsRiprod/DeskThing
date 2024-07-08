import { useState, useEffect } from 'react'
import { RequestStoreInstance, Request } from '../../store/'

const appRequest = (): JSX.Element => {
  const [formFields, setFormFields] = useState<string[]>([])
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [requestId, setRequestId] = useState<string | null>(null)
  const handleInputChange = (field: string, value: string): void => {
    setFormData({
      ...formData,
      [field]: value
    })
  }
  const handleSubmit = (): void => {
    if (requestId) {
      RequestStoreInstance.resolveRequest(requestId, formData)
      setRequestId(null)
      setFormFields([])
      setFormData({})
    }
  }

  const handleCancel = (): void => {
    setRequestId(null)
    setFormFields([])
    setFormData({})
  }

  useEffect(() => {
    const handleTriggerRequestDisplay = (request: Request): void => {
      setRequestId(request.appName)
      setFormFields(request.scopes)
      setFormData(request.scopes.reduce((acc, field) => ({ ...acc, [field]: '' }), {}))
    }

    RequestStoreInstance.on('trigger-request-display', handleTriggerRequestDisplay)

    return (): void => {
      RequestStoreInstance.off('trigger-request-display', handleTriggerRequestDisplay)
    }
  }, [])

  return (
    <div className="pointer-events-auto">
      {formFields.length > 0 && (
        <div className="bg-slate-600 animate-fade p-5 rounded-lg max-h-[95vh] overflow-auto drop-shadow-lg flex flex-col">
          <h1 className="shadow-lg m-5 bg-slate-700 p-3 rounded-xl">
            Requested Data From {requestId}
          </h1>
          {formFields.map((field) => (
            <div key={field} className="bg-slate-700 p-5 m-1 rounded-lg drop-shadow-lg">
              <label className="mr-3">{field}</label>
              <input
                className="rounded-sm focus:ring-4 focus-visible:ring-cyan-700 focus-visible:text-black text-slate-500"
                type="text"
                value={formData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
              />
            </div>
          ))}
          <div className="flex justify-between mt-3">
            <button
              className="bg-red-700 hover:bg-red-500 transition-colors px-5 py-3 self-end rounded-lg drop-shadow-lg"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="bg-slate-700 hover:bg-slate-500 transition-colors px-5 py-3 self-end rounded-lg drop-shadow-lg"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default appRequest

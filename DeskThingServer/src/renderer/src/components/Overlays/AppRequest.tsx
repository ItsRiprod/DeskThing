import { useState, useEffect } from 'react'
import RequestStore, { Request, AuthScopes } from '../../store/requestStore'

const appRequest = (): JSX.Element => {
  const [requestData, setRequestData] = useState<AuthScopes>({})
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
      RequestStore.resolveRequest(requestId, formData)
      setRequestId(null)
      setRequestData({})
      setFormData({})
    }
  }

  const handleCancel = (): void => {
    setRequestId(null)
    setRequestData({})
    setFormData({})
  }

  useEffect(() => {
    const handleTriggerRequestDisplay = (request: Request): void => {
      setRequestId(request.appName)
      setRequestData(request.scopes)
      console.log(request)
    }

    RequestStore.on('trigger-request-display', handleTriggerRequestDisplay)

    return (): void => {
      RequestStore.off('trigger-request-display', handleTriggerRequestDisplay)
    }
  }, [])

  const formFields = Object.keys(requestData)

  return (
    <div className="pointer-events-auto z-10">
      {formFields.length > 0 && (
        <div className="bg-zinc-800 animate-fade p-5 rounded-lg max-w-[95vw] max-h-[95vh] overflow-auto drop-shadow-lg flex flex-col">
          <h1 className="shadow-lg m-5 bg-slate-700 p-3 rounded-xl">
            {requestId} has requested data
          </h1>
          {formFields.map((field) => (
            <div key={field} className="bg-slate-700 p-5 m-1 rounded-lg drop-shadow-lg">
              {requestData[field].label && (
                <div className="flex pb-5">
                  <label className="mr-3">
                    <b>{requestData[field].label}</b>
                  </label>
                  <input
                    className="rounded-sm flex-1 focus:ring-4 focus-visible:ring-cyan-700 focus-visible:text-black text-slate-500"
                    type="text"
                    value={formData[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                  />
                </div>
              )}
              <div>
                <div dangerouslySetInnerHTML={{ __html: `${requestData[field].instructions}` }} />
              </div>
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

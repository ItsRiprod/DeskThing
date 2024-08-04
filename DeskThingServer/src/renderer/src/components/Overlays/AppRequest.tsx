import { FC, useState } from 'react'
import RequestStore, { Request, AuthScopes } from '../../store/requestStore'
import { IconX } from '../icons'

interface AppRequestProps {
  request: Request
  requestName: string
  onClose: () => void
}

const AppRequestOverlay: FC<AppRequestProps> = ({ request, onClose, requestName }) => {
  const [requestData, setRequestData] = useState<AuthScopes>(request.scopes)
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [requestId, setRequestId] = useState<string | null>(requestName)
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
      onClose()
    }
  }

  const handleCancel = (): void => {
    setRequestId(null)
    setRequestData({})
    setFormData({})
    onClose()
  }

  const formFields = Object.keys(requestData)

  return (
    <div className="fixed inset-0 animate-fade-in-down bg-black bg-opacity-50 flex items-center justify-center z-50">
      {formFields.length > 0 && (
        <div className="bg-gray-800 p-5 rounded-lg max-w-[95vw] max-h-[95vh] overflow-auto drop-shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{requestId} request</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 border-red-600 border p-2 rounded-lg hover:text-white hover:bg-red-500 focus:outline-none"
            >
              <IconX />
            </button>
          </div>
          {formFields.map((field) => (
            <div key={field} className="border border-slate-600 p-5 m-1 rounded-lg drop-shadow-lg">
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
              className="border border-cyan-500 hover:bg-cyan-500 px-5 py-3 self-end rounded-lg drop-shadow-lg"
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

export default AppRequestOverlay

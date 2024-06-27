import { useState, useEffect } from 'react'

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
      window.electron.ipcRenderer.send(`user-data-response-${requestId}`, formData)
      setRequestId(null)
      setFormFields([])
      setFormData({})
    }
  }
  useEffect(() => {
    const handleDisplayUserForm = (_event: any, requestId: string, fields: string[]): void => {
      setRequestId(requestId)
      setFormFields(fields)
      setFormData(fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {}))
      console.log(_event)
    }

    window.electron.ipcRenderer.on('display-user-form', handleDisplayUserForm)

    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('display-user-form')
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
          <button
            className="bg-slate-700 hover:bg-slate-500 transition-colors p-5 self-end rounded-lg drop-shadow-lg"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}

export default appRequest

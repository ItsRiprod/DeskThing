import React, { useState, useEffect } from 'react'

function App(): JSX.Element {
  const [appsList, setAppsList] = useState<string[]>([]) // State to hold list of apps
  const [formFields, setFormFields] = useState<string[]>([])
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [requestId, setRequestId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // Function to handle dropped files
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        await handleZipFile(file.path)
        setAppsList([...appsList, file.name])
      }
    }
  }

  async function handleZipFile(zipFilePath: string): Promise<void> {
    try {
      // Notify the main process to handle the zip file
      setAppsList([...appsList, zipFilePath]) // Add the file path to the list
      window.electron.ipcRenderer.send('handle-zip', zipFilePath)
    } catch (error) {
      console.error('Error handling zip file:', error)
    }
  }

  const handleAddAndRunApp = (appName: string): void => {
    if (appName.endsWith('.zip')) {
      const newAppName = appName.replace('.zip', '')
      window.electron.ipcRenderer.send('add-app', newAppName) // Send appName to the main process
    } else {
      console.log('App name is not a zip file!')
    }
  }

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
  const handleSendMessage = (): void => {
    if (message) {
      const messageArray = message.split(' ')

      window.electron.ipcRenderer.send('user-data-response', ...messageArray)
    }
  }

  useEffect(() => {
    const handleDisplayUserForm = (_event: any, requestId: string, fields: string[]): void => {
      setRequestId(requestId)
      setFormFields(fields)
      setFormData(fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {}))
    }

    window.electron.ipcRenderer.on('display-user-form', handleDisplayUserForm)

    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('display-user-form')
    }
  }, [])

  const renderForm = (): JSX.Element => (
    <div>
      {formFields.map((field) => (
        <div key={field}>
          <label>{field}</label>
          <input
            type="text"
            value={formData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )

  // Render the list of apps
  const renderAppsList = (): JSX.Element[] => {
    return appsList.map((fileName, index) => (
      <div key={index} className="app-item">
        {fileName} {/* Display the file path */}
        <button onClick={() => handleAddAndRunApp(fileName)}>Add & Run</button>
      </div>
    ))
  }

  return (
    <>
      <div>
        <label>Communicate With APPS: </label>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button onClick={handleSendMessage}>Submit</button>
      </div>
      <div className="actions">
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
          <button onClick={() => handleAddAndRunApp('spotify.zip')}>Run Spotify</button>
        </div>
      </div>
      {/* Drop zone for drag-n-drop */}
      <div className="drop-zone" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        Drop your files here
      </div>
      {/* Display the list of apps */}
      <div className="apps-list">{renderAppsList()}</div>
      {formFields.length > 0 && renderForm()}
    </>
  )
}

export default App

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import RootLayout from './Layout'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootLayout>
      <App />
    </RootLayout>
  </React.StrictMode>
)

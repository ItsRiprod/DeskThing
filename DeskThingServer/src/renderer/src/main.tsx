/**
 * Renders the main application with the root layout.
 *
 * This code creates the root React component and renders the `App` component
 * inside the `RootLayout` component. The root component is then rendered to the
 * DOM element with the ID 'root'.
 */
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

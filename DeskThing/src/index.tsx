import React from 'react';
import ReactDOM from 'react-dom/client';
import ViewManager from './views/views';
import RootLayout from './Layout'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <RootLayout>
      <ViewManager />
    </RootLayout>
  </React.StrictMode>
);

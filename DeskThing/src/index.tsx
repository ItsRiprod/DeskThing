import React from 'react';
import ReactDOM from 'react-dom/client';
import RootLayout from './Layout'
import ErrorBoundary from './utils/ErrorBoundry';
import ViewManager from './views/views';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <RootLayout>
        <ViewManager />
      </RootLayout>
    </ErrorBoundary>
  </React.StrictMode>
);

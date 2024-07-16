import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ViewManager from './views/views';


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ViewManager />
  </React.StrictMode>
);

import React from 'react';
import './AppSelector.css';
import { App } from 'src/helpers/WebSocketService';
interface AppSelectorProps {
  currentView: string;
  apps: App[];
  onAppSelect: (app: string) => void;
  className?: string;
}

const AppSelector: React.FC<AppSelectorProps> = ({ currentView, apps, onAppSelect, className }) => {

  return (
    <div className={`appselector ${className}`}>
      {apps.map((app, index) => 
        app.manifest?.isLocalApp || app.manifest?.isWebApp ?
        (<button
          key={app.manifest.id}
          className={`app-button ${app.prefIndex < 5 ? 'preferred' : ''} ${currentView === app.manifest.id ? 'current' : ''}`}
          onClick={() => onAppSelect(app.manifest.id)}
        >
          {app.name}
        </button>)
        :
        (<div key={index}></div>)
      )}
    </div>
  );
};

export default AppSelector;

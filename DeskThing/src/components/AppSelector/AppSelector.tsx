import React, { useEffect, useState } from 'react';
import './AppSelector.css';
import { App } from '../../helpers/WebSocketService';
import { AppStore } from '../../store';
interface AppSelectorProps {
  onAppSelect: (app: string) => void;
  className?: string;
}

const AppSelector: React.FC<AppSelectorProps> = ({ onAppSelect, className }) => {
  const [apps, setApps] = useState<App[]>(AppStore.getApps())
  const [currentView, setCurrentView] = useState<string>(AppStore.getCurrentView())

  useEffect(() => {
    const handleAppUpdate = (data: App[]) => {
      setApps(data)
      setCurrentView(AppStore.getCurrentView())
      console.log(data)
    };

    const unsubscribe = AppStore.subscribeToAppUpdates(handleAppUpdate);

    return () => {
      unsubscribe()
    };
  })

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

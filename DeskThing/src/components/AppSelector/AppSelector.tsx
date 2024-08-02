import React, { useEffect, useState } from 'react';
import './AppSelector.css';
import { App } from '../../helpers/WebSocketService';
import { AppStore } from '../../store';
interface AppSelectorProps {
  onAppSelect: (app: string) => void;
  active: boolean,
  visible: boolean,
}

const AppSelector: React.FC<AppSelectorProps> = ({ onAppSelect, active, visible }) => {
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
    <div className={`absolute z-50 w-screen pb-5 justify-around flex flex-wrap overflow-hidden top-0 left-0 ${visible ? ' h-screen overflow-y-auto bg-gray-800' : active ? 'h-52 bg-transparent' : 'h-0'} transition-all`}>
      {apps.map((app, index) => 
        app.manifest?.isLocalApp || app.manifest?.isWebApp ?
        (<button
          key={app.manifest.id}
          className={`bg-black m-1 h-24 p-5 border rounded-lg cursor-pointer w-1/5 ${active || visible ? '' : 'hidden'} ${app.prefIndex < 5 || visible ? 'preferred' : 'hidden'} ${currentView === app.manifest.id ? 'border-green-600' : 'border-white'}`}
          onClick={() => onAppSelect(app.manifest.id)}
        >
          {app.manifest? app.manifest.label : app.name}
        </button>)
        :
        (<div key={index}></div>)
      )}
     
    </div>
  );
};

export default AppSelector;

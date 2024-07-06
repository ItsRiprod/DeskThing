import React from 'react';
import './AppSelector.css';
interface AppSelectorProps {
  preferredApps: Array<string>;
  currentView: string;
  apps: string[];
  onAppSelect: (app: string) => void;
  className?: string;
}

const AppSelector: React.FC<AppSelectorProps> = ({ preferredApps, currentView, apps, onAppSelect, className }) => {
  const allApps = [...new Set([...preferredApps, ...apps])];

  return (
    <div className={`appselector ${className}`}>
      {allApps.map((app) => (
        <button
          key={app}
          className={`app-button ${preferredApps.includes(app) ? 'preferred' : ''} ${currentView === app ? 'current' : ''}`}
          onClick={() => onAppSelect(app)}
        >
          {app}
        </button>
      ))}
    </div>
  );
};

export default AppSelector;

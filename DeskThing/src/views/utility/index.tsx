import { IconDevice } from '../../components/todothingUIcomponents';
import './styles.css';
import { FC, useEffect, useState } from 'react';
import socket, { App } from '../../helpers/WebSocketService';

export interface Settings {
  app: {
    [setting: string]: {
      value: string | number;
      label: string;
      options: [
        {
          value: string | number;
          label: string;
        } 
      ]
    };
  };
}

const Utility: FC = (): JSX.Element => {
  const [apps, setApps] = useState<App[] | null>(null);
  const [currentId, setCurrentId] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);

  const version = "0.5.3" // TODO: Make this an environment variable set by package.json

  useEffect(() => {
    requestPreferences()
  }, [])

  const requestPreferences = () => {
    if (socket.is_ready()) {
      const data = {
        app: 'server',
        type: 'get',
      };
      socket.post(data);
    }
  }
  const sendSettingsUpdate = (app: string, setting: string, value: string) => {
    if (socket.is_ready()) {
      const data = {
        app: app,
        type: 'set',
        request: 'update_setting',
        data: {
          setting: setting,
          value: value,
        }
      };
      socket.post(data);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (msg: any) => {
      if (msg.type === 'config' && typeof msg.data === 'object') {
        setApps(msg.data as App[]);
      }
      if (msg.type === 'settings' && typeof msg.data === 'object') {
        setSettings(msg.data as Settings);
      }
    };

    const removeListener = socket.on('client', listener);

    return () => {
      removeListener();
    };
  }, []);

  const handleSelectChange = (appName: string, settingKey: string, value) => {
    console.log(`Setting ${appName}'s ${settingKey} to ${value}`);
    sendSettingsUpdate(appName, settingKey, value)
    setTimeout(() => {
      requestPreferences()
    }, 100)
  };

  const handleSettingClick = (appId: string) => {
    setCurrentId(appId);
    setExpandedSetting(null);
  };

  const handleExpandClick = (settingKey: string) => {
    setExpandedSetting(expandedSetting === settingKey ? null : settingKey);
  };

  return (
    <div className="flex h-screen pt-10 pb-28">
      <div className="container overflow-y-scroll border-2 rounded-lg border-slate-500 h-full m-1 flex-col justify-center max-w-fit p-5">
        {apps && apps.map((app) => (
          <div key={app.manifest.id} className={(currentId == app.manifest.id ? 'bg-slate-500' : '') + ' border-b-2 border-slate-500 p-3'} onClick={() => handleSettingClick(app.manifest.id)}>
            <h3 className="text-3xl">{app.name}</h3>
          </div>
        ))}
      </div>
      <div className="container flex flex-col gap-2 overflow-y-scroll border-2 pb-32 rounded-lg border-slate-500 h-full m-1 p-5">

        {settings && settings[currentId] ? Object.keys(settings[currentId]).map((settingKey) => (

          <div key={settingKey} className={`shrink-0 cursor-pointer border rounded-xl overflow-hidden border-slate-500 ${expandedSetting === settingKey ? 'bg-slate-900' : ''}`} onClick={() => handleExpandClick(settingKey)}>
            <div className="flex justify-between p-3">
              <h2 className="text-3xl text-justify">{settings[currentId][settingKey].label}</h2>
              <div className="bg-slate-700 px-5 mr-10 rounded-lg flex items-center">
                <p className="text-1xl">{settings[currentId][settingKey].value}</p>
              </div>
            </div>
            {expandedSetting === settingKey && (
              <div className=" flex flex-col gap-2 justify-between p-5">
                {settings[currentId][settingKey].options.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectChange(currentId, settingKey, item.value)}
                    className="bg-slate-700 p-3 mr-10 rounded-lg flex justify-between"
                  >
                    <p className="text-2xl">{item.label}</p>
                    <p className="text-2xl">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )) : (
          <div className="flex justify-center items-center h-full">
            <IconDevice iconSize={256} text={`Settings v${version}`} fontSize={110} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Utility;
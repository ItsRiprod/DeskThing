import { IconDevice } from '../../components/todothingUIcomponents';
import './Utility.css';
import { FC, useEffect, useState } from 'react';
import socket from '../../helpers/WebSocketService';

interface SettingOption {
  label: string;
  value: string;
}

interface AppSettings {
  label: string;
  value: string;
  options: SettingOption[];
}

interface Preferences {
  settings: {
    [appName: string]: {
      [settingKey: string]: AppSettings;
    };
  };
}

const Utility: FC = (): JSX.Element => {
  const [preferences, setCurrentPreferences] = useState<Preferences | null>(null);
  const [setting, currentSetting] = useState('');
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
      if (msg.type === 'utility_data' && typeof msg.data === 'object') {
        setCurrentPreferences(msg.data as Preferences);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSelectChange = (appName: string, settingKey: string, value) => {
    console.log(`Setting ${appName}'s ${settingKey} to ${value}`);
    sendSettingsUpdate(appName, settingKey, value)
    setTimeout(() => {
      requestPreferences()
    }, 100)
  };

  return (
    <div className="flex h-screen pt-10 pb-28">
      <div className="container border-2 rounded-lg border-slate-500 h-full m-1 flex-col justify-center max-w-fit p-5">
        {preferences?.settings && Object.keys(preferences.settings).map((appName) => (
          <div key={appName} className={(setting == appName ? 'bg-slate-500' : '') + ' border-b-2 border-slate-500 p-3'} onClick={() => currentSetting(appName)}>
            <h3 className="text-3xl">{appName}</h3>
          </div>
        ))}
      </div>
      <div className="container border-2 rounded-lg border-slate-500 h-full m-1 p-5">

        {preferences?.settings[setting] ? Object.keys(preferences.settings[setting]).map((settingKey) => (

              <div key={settingKey} className=" overflow-hidden h-20">
                <div className="flex justify-between p-3">
                  <h2 className="text-5xl">{preferences.settings[setting][settingKey].label}</h2>
                  <div className="bg-slate-700 px-5 mr-10 rounded-lg flex items-center">
                    <p className="text-1xl right-0">{preferences.settings[setting][settingKey].value}</p>
                  </div>
                </div>
                <div className="bg-slate-500 flex justify-between p-5">
                  {preferences.settings[setting][settingKey].options.map((item, index) => (
                    <div key={index} onClick={()=> handleSelectChange(setting, settingKey, item.value)}
                        className="bg-slate-700 p-3 mr-10 rounded-lg flex items-center">
                      <p className="text-2xl right-0">
                        {item.label}
                        </p>
                    </div>
                  ))}
                </div>
              </div>
        )) : (
          <div className="flex justify-center items-center h-full">
            <IconDevice iconSize={256} text={'Settings'} fontSize={150} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Utility;

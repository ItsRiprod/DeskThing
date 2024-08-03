import { IconDevice } from '../../components/icons';
import './styles.css';
import { FC, useEffect, useState, useRef } from 'react';
import socket, { App, Settings } from '../../helpers/WebSocketService';
import { AppStore, ManifestStore, ServerManifest } from '../../store';

const Utility: FC = (): JSX.Element => {
  const [currentId, setCurrentId] = useState('');
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);
  
  const settingsRef = useRef<Settings | null>(AppStore.getSettings());
  const appsRef = useRef<App[] | null>(AppStore.getApps());
  const serverManifestRef = useRef<ServerManifest>(ManifestStore.getManifest());

  const [serverManifest, setServerManifest] = useState<ServerManifest>(serverManifestRef.current);
  const [apps, setApps] = useState<App[] | null>(appsRef.current);
  const [settings, setSettings] = useState<Settings | null>(settingsRef.current);

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
    const updateManifest = (manifest: ServerManifest) => {
      serverManifestRef.current = manifest;
      setServerManifest(manifest);
    };

    const updateApps = (data: App[]) => {
      appsRef.current = data;
      setApps(data);
    };

    const updateSettings = (data: Settings) => {
      settingsRef.current = data;
      setSettings(data);
    };

    const removeManifestListener = ManifestStore.on(updateManifest);
    const removeAppListener = AppStore.subscribeToAppUpdates(updateApps);
    const removeSettingListener = AppStore.subscribeToSettingsUpdates(updateSettings);

    return () => {
      removeAppListener();
      removeManifestListener();
      removeSettingListener();
    };
  }, []);

  const handleSelectChange = (appName: string, settingKey: string, value) => {
    console.log(`Setting ${appName}'s ${settingKey} to ${value}`);
    sendSettingsUpdate(appName, settingKey, value)

    if (socket.is_ready()) {
      const data = {
        app: 'server',
        type: 'get',
      };
      socket.post(data);
    }
  };

  const handleSettingClick = (appId: string) => {
    setCurrentId(appId);
    setExpandedSetting(null);
  };

  const handleExpandClick = (settingKey: string) => {
    setExpandedSetting(expandedSetting === settingKey ? null : settingKey);
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen pt-10 pb-28">
      <div className="sm:overflow-y-scroll overflow-x-scroll overflow-y-hidden sm:overflow-x-hidden border-2 rounded-lg border-slate-500 h-fit w-auto sm:h-full m-1 flex-row flex sm:flex-col pb-10">
        {apps && apps.map((app) => (
          <div key={app.manifest.id} className={(currentId == app.manifest.id ? 'bg-slate-500' : '') + ' w-fit sm:w-full h-fit sm:border-b-2 border-slate-500 p-3'} onClick={() => handleSettingClick(app.manifest.id)}>
            <h3 className="text-3xl">{app.name}</h3>
          </div>
        ))}
      </div>
      <div className="w-full flex flex-col gap-2 overflow-y-scroll border-2 pb-32 rounded-lg border-slate-500 h-full m-1 p-5">

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
          <div className="flex justify-center flex-col items-center h-full">
            <IconDevice iconSize={512} text={`${serverManifest.version}`} fontSize={110} />
            <p>{serverManifest.name}</p>
            <p>{serverManifest.port}</p>
            <p>{serverManifest.ip}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Utility;
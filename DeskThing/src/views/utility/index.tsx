import { IconDevice } from '../../components/todothingUIcomponents';
import './Utility.css';
import { FC, useEffect, useState } from 'react';
import socket from '../../helpers/WebSocketService';

const Utility: FC = (): JSX.Element => {
  const [preferences, setCurrentPreferences] = useState<any>();
  useEffect(() => {
    requestPreferences()
  }, [])

  const requestPreferences = () => {
    if (socket.is_ready()) {
      const data = {
        app: 'utility',
        type: 'get',
      };
      socket.post(data);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (msg: any) => {
      if (msg.type === 'utility_data') {
        setCurrentPreferences(msg.data);
        console.log(msg)
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  return (
    <div className="view_default">
      {preferences?.settings && Object.keys(preferences.settings).map((appName) => (
      <div key={appName}>
        <h3>{appName}</h3>
        {Object.keys(preferences.settings[appName]).map((settingKey) => (
          <div key={settingKey}>
            <h4>{settingKey}</h4>
            <div>
              <p>Label: {preferences.settings[appName][settingKey].label}</p>
              <p>Value: {preferences.settings[appName][settingKey].value}</p>
              <p>Options:</p>
            </div>
          </div>
        ))}
      </div>
    ))}

      <IconDevice iconSize={100} text={'Settings'} fontSize={150}/>
    </div>
  );
};

export default Utility;

import { IconLogo, IconLogoGearLoading } from '../../components/icons';
import './styles.css';
import React, { useState, useEffect } from 'react';
import socket from '../../helpers/WebSocketService';
import { ManifestStore, ServerManifest } from '../../store';

const Landing: React.FC = (): JSX.Element => {
  const [manifest, setManifest] = useState<ServerManifest>(ManifestStore.getManifest())

  const requestPreferences = () => {
    if (socket.is_ready()) {
      const data = {
        app: 'server',
        type: 'get',
      };
      socket.post(data);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (manifest: ServerManifest) => {
      setManifest(manifest)
    };

    requestPreferences()

    const removeListener = ManifestStore.on(listener);

    return () => {
      removeListener();
    };
  }, []);

  return (
    <div className="view_default">
      <div className="flex items-center font-THEBOLDFONT">
        <IconLogoGearLoading iconSize={124} /><IconLogo width={250} height={119}/>
      </div>
      {manifest && (
          <div>
            <p>
              Web Version: {manifest.version}
            </p>
            <p>
              {manifest.name}: {manifest.description}
            </p>
            <p>
              Built By: {manifest.author}
            </p>
            <p>
              IP Address: {manifest.ip}
            </p>
            <p>
              PORT: {manifest.port}
            </p>
            <button
            onClick={requestPreferences}
            className="p-3 border border-blue-500 rounded-2xl hover:bg-blue-400">Reload</button>
          </div>
        )
      }

    </div>
  );
};

export default Landing;

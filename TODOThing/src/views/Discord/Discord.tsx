import './Discord.css';
import React, { useEffect, useState } from 'react';
import socket from '../../helpers/WebSocketService';

const Discord: React.FC = () => {
  const [discordData, setDiscordData] = useState<{ [key: string]: any }>({});

  const handleDiscordData = (data: any) => {
    if (data.connected) {
      if (data.action) {
        if (data.speaking == null) {
          data.speaking = false;
        }

        if (data.action === 'connect' || data.action === 'update') {
          setDiscordData((oldData) => ({
            ...oldData,
            [data.user.id]: data,
          }));
        } else if (data.action === 'disconnect') {
          setDiscordData((oldData) => {
            const { [data.user.id]: _, ...newData } = oldData;
            return newData;
          });
        } else if (data.action === 'speaking') {
          setDiscordData((oldData) => ({
            ...oldData,
            [data.user_id]: {
              ...oldData[data.user_id],
              speaking: data.val,
            },
          }));
        }
      } else {
        setDiscordData((oldData: { [key: string]: any }) => ({
          ...oldData,
          [data.user.id]: data,
        }));
      }
    } else {
      setDiscordData({});
    }
  };

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'discord_data') {
        handleDiscordData(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendCommand = (command: string) => {
    if (socket.is_ready()) {
      const data = {
        type: 'command',
        command: null,
      };
      socket.post(data);
    }
  };

  return (
    <div className="view_discord">
      {Object.keys(discordData).length ? (
        Object.keys(discordData).map((userId) => (
          <div key={userId} className="profile_container">
            <div
              className={`profile ${discordData[userId]?.speaking ? 'speaking' : ''}`}
              style={{ backgroundImage: `url(${discordData[userId].avatar_source})` }}
            >
              <div className={`profile_icon ${discordData[userId]?.muted ? 'muted' : ''}`} />
            </div>
            <p className="discord_name">{discordData[userId].nick}</p>
          </div>
        ))
      ) : (
        <div>
          <h1>Discord</h1>
        </div>
      )}
    </div>
  );
};

export default Discord;

import './styles.css';
import React, { useEffect, useState, useRef } from 'react';
import socket, { socketData } from '../../helpers/WebSocketService';
import { IconMicDiscord, IconDeafenedDiscord, IconDeafenedOffDiscord, IconCallDiscord, IconMicOffDiscord } from '../../components/icons';

const Discord: React.FC = () => {
  const [discordData, setDiscordData] = useState<{ [key: string]: any }>({});
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const discordIslandRef = useRef<HTMLDivElement>(null);

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
    const listener = (msg: socketData) => {
      if (msg.type === 'discord_data') {
        handleDiscordData(msg.data);
      }
    };

    const removeListener = socket.on('discord', listener);

    return () => {
      removeListener();
    };
  }, []);

  const handleTouchOutside = (event: TouchEvent) => {
    if (discordIslandRef.current && !discordIslandRef.current.contains(event.target as Node)) {
      discordIslandRef.current.classList.remove('visible');
    }
  };

  const handleTouchInside = () => {
    if (discordIslandRef.current) {
      discordIslandRef.current.classList.add('visible');
    }
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, []);

  //const handleSendCommand = (command: string) => {
  //  if (socket.is_ready()) {
  //    const data = {
  //      type: 'command',
  //      command: null,
  //    };
  //    socket.post(data);
  //  }
  //};

  const handleMic = () => {
    setMuted((old) => !old);
  }
  const handleDeaf = () => {
    setDeafened((old) => !old);
  }

  useEffect(() => {
    console.log(discordData);
  }, [discordData])

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
      <div className="discord_island_wrapper "
      ref={discordIslandRef}
      onTouchStart={handleTouchInside}>
        <div className="discord_island ">
          <button onClick={handleMic}>
            {muted ?
            <IconMicOffDiscord iconSize={60} className={'icon discord_active'} />
            :
            <IconMicDiscord iconSize={60} className={'icon'} />
            }
          </button>
          <button onClick={handleDeaf}>
            {deafened ?
            <IconDeafenedDiscord iconSize={60} className={'icon discord_active'} />
             :
            <IconDeafenedOffDiscord iconSize={60} className={'icon'} />
            }
          </button>
          <button onClick={handleMic}>
            <IconCallDiscord iconSize={60} className={'icon discord_active'} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Discord;

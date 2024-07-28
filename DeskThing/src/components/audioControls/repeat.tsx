import React, { useEffect, useState } from 'react';
import controlHandler from '../../store/controlStore';
import { song_data } from 'src/helpers/WebSocketService';
import { Repeat } from '../../utils/audioControlActions';
import { IconRepeat, IconRepeatOne } from '../icons';

const RepeatComponent: React.FC = () => {
  const [songData, setSongData] = useState<song_data>(controlHandler.getSongData());
  useEffect(() => {
    const handleSongDataUpdate = (data: song_data) => {
      setSongData(data);
    };

    // Subscribe to song data updates
    const unsubscribe = controlHandler.subscribeToSongDataUpdate(handleSongDataUpdate);

    // Cleanup on unmount
    return () => {
        unsubscribe()
    };
  }, []);
  
  return (
        <button onClick={Repeat}>
            {songData.repeat_state == 'off' ? <IconRepeat iconSize={48} /> : songData.repeat_state == 'all' ? <IconRepeat className={'text-green-500'} iconSize={48} /> : <IconRepeatOne className={'text-green-500'} iconSize={48} />}
        </button>
    )
};

export default RepeatComponent;
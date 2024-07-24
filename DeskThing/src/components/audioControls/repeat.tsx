import React, { useEffect, useState } from 'react';
import controlHandler from '../../helpers/controlHandler';
import { song_data } from 'src/helpers/WebSocketService';
import { runRepeat } from '../../utils/audioControlActions';
import { IconRepeat, IconRepeatOne } from '../icons';

const Repeat: React.FC = () => {
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
        <button onClick={runRepeat}>
            {songData.repeat_state == 'off' ? <IconRepeat iconSize={48} /> : songData.repeat_state == 'all' ? <IconRepeat className={'text-green-500'} iconSize={48} /> : <IconRepeatOne className={'text-green-500'} iconSize={48} />}
        </button>
    )
};

export default Repeat;
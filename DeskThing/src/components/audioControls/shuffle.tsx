import React, { useEffect, useState } from 'react';
import controlHandler from '../../helpers/controlHandler';
import { song_data } from 'src/helpers/WebSocketService';
import { runShuffle } from '../../utils/audioControlActions';
import { IconShuffle } from '../icons';

const Shuffle: React.FC = () => {
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
    <button className="" onClick={runShuffle}>
      {songData.shuffle_state ? <IconShuffle iconSize={48} className={'text-green-500'} /> : <IconShuffle iconSize={48} />}
    </button>
    )
};

export default Shuffle;
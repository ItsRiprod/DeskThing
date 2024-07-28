import React, { useEffect, useState } from 'react';
import controlHandler from '../../store/controlStore';
import { song_data } from 'src/helpers/WebSocketService';
import { PlayPause } from '../../utils/audioControlActions';
import { IconPause, IconPlay } from '../icons';

const PlayPauseComponent: React.FC = () => {
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
        <button className="text-green-500" onClick={PlayPause}>
            {songData.is_playing ?  <IconPause iconSize={48} /> : <IconPlay iconSize={48} />}
        </button>
    )
};

export default PlayPauseComponent;
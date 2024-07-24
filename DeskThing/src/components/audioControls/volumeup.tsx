import React from 'react';
import { runVolUp } from '../../utils/audioControlActions';
import { IconVolumeUp } from '../icons';

const VolumeUp: React.FC = () => {  
  return (
        <button onClick={runVolUp}>
            <IconVolumeUp iconSize={75}  />
        </button>
    )
};

export default VolumeUp;
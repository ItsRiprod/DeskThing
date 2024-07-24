import React from 'react';
import { runVolDown } from '../../utils/audioControlActions';
import { IconVolumeDown } from '../icons';

const VolumeUp: React.FC = () => {  
  return (
        <button onClick={runVolDown}>
            <IconVolumeDown iconSize={75}  />
        </button>
    )
};

export default VolumeUp;
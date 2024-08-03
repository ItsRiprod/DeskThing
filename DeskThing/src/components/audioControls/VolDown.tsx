import React from 'react';
import { VolDown } from '../../utils/audioControlActions';
import { IconVolumeDown } from '../icons';

const VolDownComponent: React.FC = () => {  
  return (
        <button className="bg-transparent" onClick={VolDown}>
            <IconVolumeDown iconSize={75}  />
        </button>
    )
};

export default VolDownComponent;
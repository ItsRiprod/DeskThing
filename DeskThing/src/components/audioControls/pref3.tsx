import React from 'react';
import { Pref3 } from '../../utils/audioControlActions';
import { IconDevice } from '../icons';

const Pref3Component: React.FC = () => {  
  return (
        <button onClick={() => Pref3()}>
            <IconDevice iconSize={75} strokeWidth={24} fontSize={250} text="Pref 3" />
        </button>
    )
};

export default Pref3Component;
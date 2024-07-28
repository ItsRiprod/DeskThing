import React from 'react';
import { Pref4 } from '../../utils/audioControlActions';
import { IconDevice } from '../icons';

const Pref4Component: React.FC = () => {  
  return (
        <button onClick={() => Pref4()}>
            <IconDevice iconSize={75} strokeWidth={24} fontSize={250} text="Pref 4" />
        </button>
    )
};

export default Pref4Component;
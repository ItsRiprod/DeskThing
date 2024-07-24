import React from 'react';
import { runSetPref } from '../../utils/audioControlActions';
import { IconDevice } from '../icons';

const Pref4: React.FC = () => {  
  return (
        <button onClick={() => runSetPref(4)}>
            <IconDevice iconSize={75} strokeWidth={24} fontSize={250} text="Pref 4" />
        </button>
    )
};

export default Pref4;
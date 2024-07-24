import React from 'react';
import { runSetPref } from '../../utils/audioControlActions';
import { IconDevice } from '../icons';

const Pref3: React.FC = () => {  
  return (
        <button onClick={() => runSetPref(3)}>
            <IconDevice iconSize={75} strokeWidth={24} fontSize={250} text="Pref 3" />
        </button>
    )
};

export default Pref3;
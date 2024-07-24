import React from 'react';
import { runSetPref } from '../../utils/audioControlActions';
import { IconDevice } from '../icons';

const Pref2: React.FC = () => {  
  return (
        <button onClick={() => runSetPref(2)}>
            <IconDevice iconSize={75} strokeWidth={24} fontSize={250} text="Pref 2" />
        </button>
    )
};

export default Pref2;
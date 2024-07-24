import React from 'react';
import { runSetPref } from '../../utils/audioControlActions';
import { IconDevice } from '../icons';

const Pref1: React.FC = () => {  
  return (
        <button onClick={() => runSetPref(1)}>
            <IconDevice iconSize={75} strokeWidth={24} fontSize={250} text="Pref 1" />
        </button>
    )
};

export default Pref1;
import React from 'react';
import { Pref2 } from '../../utils/audioControlActions';
import { IconDevice } from '../icons';

const Pref2Component: React.FC = () => {  
  return (
        <button onClick={() => Pref2()}>
            <IconDevice iconSize={75} strokeWidth={24} fontSize={250} text="Pref 2" />
        </button>
    )
};

export default Pref2Component;
import React from 'react';
import { Pref1 } from '../../utils/audioControlActions';
import { IconDevice } from '../icons';

const Pref1Component: React.FC = () => {  
  return (
        <button className="bg-transparent" onClick={() => Pref1}>
            <IconDevice iconSize={75} strokeWidth={24} fontSize={250} text="Pref 1" />
        </button>
    )
};

export default Pref1Component;
import { FC } from 'react';
import { runRewind } from '../../utils/audioControlActions';
import { IconSkipBack } from '../icons';

const Rewind: FC = () => {
 
  return (
        <button className="text-green-500" onClick={runRewind}>
            <IconSkipBack iconSize={48} />
        </button>
    )
};

export default Rewind;
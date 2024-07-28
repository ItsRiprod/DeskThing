import { FC } from 'react';
import { Rewind } from '../../utils/audioControlActions';
import { IconSkipBack } from '../icons';

const RewindComponent: FC = () => {
 
  return (
        <button className="text-green-500" onClick={Rewind}>
            <IconSkipBack iconSize={48} />
        </button>
    )
};

export default RewindComponent;
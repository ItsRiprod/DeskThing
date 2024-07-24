import { FC } from 'react';
import { runSkip } from '../../utils/audioControlActions';
import { IconSkipForward } from '../icons';

const Skip: FC = () => {  
  return (
        <button className="text-green-500" onClick={runSkip}>
            <IconSkipForward iconSize={48} />
        </button>
    )
};

export default Skip;
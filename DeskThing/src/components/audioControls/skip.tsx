import { FC } from 'react';
import { Skip } from '../../utils/audioControlActions';
import { IconSkipForward } from '../icons';

const SkipComponent: FC = () => {  
  return (
        <button className="text-green-500 bg-transparent" onClick={Skip}>
            <IconSkipForward iconSize={48} />
        </button>
    )
};

export default SkipComponent;
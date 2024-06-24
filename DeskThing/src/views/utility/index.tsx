import { IconDevice } from '../../components/todothingUIcomponents';
import './Utility.css';
import React from 'react';

const Default: React.FC = (): JSX.Element => {
  return (
    <div className="view_default">
      <IconDevice iconSize={445} text={'Settings'} fontSize={150}/>
    </div>
  );
};

export default Default;

import { IconDevice } from '../../components/todothingUIcomponents';
import './Default.css';
import React from 'react';

const Default: React.FC = (): JSX.Element => {
  return (
    <div className="view_default">
      <IconDevice iconSize={445} />
    </div>
  );
};

export default Default;

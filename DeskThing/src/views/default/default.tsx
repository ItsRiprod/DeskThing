import { IconDevice } from '../../components/todothingUIcomponents';
import './default.css';
import React from 'react';

const Default: React.FC = (): JSX.Element => {
  return (
    <div className="view_default">
      <p style={{ fontSize: '70px', }}>Default View</p>
      <IconDevice iconSize={45} />
    </div>
  );
};

export default Default;

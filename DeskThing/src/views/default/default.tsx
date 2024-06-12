import './default.css';
import React from 'react';

const Default: React.FC = (): JSX.Element => {
  return (
    <div className="view_default">
      <p style={{ fontSize: '70px', fontFamily: "'Bebas Neue', cursive" }}>Default View</p>
    </div>
  );
};

export default Default;

import React from 'react';
import './Body.css';
interface BodyProps {
  children: React.ReactNode;
}

const body: React.FC<BodyProps> = ({ children }) => {
  return <div className="body">{children}</div>;
};

export default body;

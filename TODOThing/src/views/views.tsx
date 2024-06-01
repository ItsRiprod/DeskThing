import './views.css';
import React from 'react';
import Default from './default/default';
import viewStore, { AppView } from './appView';

import Body from '../components/Body/Body';

const Views: React.FC = (): JSX.Element => {
  const renderView = () => {
    switch (viewStore.appView) {
      case AppView.MAIN:
        return <Default />;
      default:
        return null; // or a fallback component
    }
  };

  return (
    <div className="App">
      <Body>{renderView()}</Body>
    </div>
  );
};

export default Views;

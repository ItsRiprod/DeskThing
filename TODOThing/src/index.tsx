import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
//import ButtonHelper, { Button, EventFlavour } from './helpers/ButtonHelper';
import ControlWebsocketHelper from './helpers/ControlWebsocketHelper';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

//const button_helper = new ButtonHelper();
//button_helper.addListener(Button.BUTTON_1, EventFlavour.Down, () => alert('whoop'));
/* We need to connect to the internal websocket, else the car thing kills the webview */
const _socket_helper = new ControlWebsocketHelper();

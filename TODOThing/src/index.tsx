import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ControlWebsocketHelper from './helpers/ControlWebsocketHelper';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ViewManager from './views/views';


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <div className="App">
      <header className="App-header">
        <Header />
        <ViewManager />
        <Footer />
      </header>
    </div>
  </React.StrictMode>
);

//const button_helper = new ButtonHelper();
//button_helper.addListener(Button.BUTTON_1, EventFlavour.Down, () => alert('whoop'));
/* We need to connect to the internal websocket, else the car thing kills the webview */
const _socket_helper = new ControlWebsocketHelper();

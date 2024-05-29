import ReactDOM from 'react-dom';
// import configureMobx from 'mobxConfig';
import App from 'App';
import 'Fonts.css';
import HardwareEvents from 'helpers/HardwareEvents';
import hardwareEventHandler from 'eventhandler/HardwareEventHandler';
import MockHardwareEvents from 'helpers/MockHardwareEvents';
import InterappActions from 'middleware/InterappActions';
import MiddlewareRequest from 'middleware/MiddlewareRequest';
import StoreProvider from './context/store';
import { RootStore } from 'store/RootStore';
import Socket from 'Socket';
import MiddlewareActions from 'middleware/MiddlewareActions';
import MiddlewareStorage from 'middleware/MiddlewareStorage';
import ErrorHandler from 'eventhandler/ErrorHandler';
import Backtrace from 'helpers/Backtrace';
import RequestLogger from 'helpers/RequestLogger';
import { no_wamp_session_destroyed } from 'eventhandler/ErrorHandlerFilters';
import { migrateAllFromLocalStorage } from 'system/StorageMigration';

const rootElement = document.getElementById('root');

const isProduction = process.env.NODE_ENV === 'production';

// we're working with the prod build so this was compiled out, it seems
/*if (!isProduction) {
  configureMobx();
}*/

// Setup websocket connection
const requestLogger = new RequestLogger();
const socket = new Socket(requestLogger);
const middlewareActions = new MiddlewareActions(socket);
const middlewareRequest = new MiddlewareRequest(socket);
const middlewareStorage = new MiddlewareStorage(socket);
const interappActions = new InterappActions(middlewareRequest);

migrateAllFromLocalStorage(middlewareStorage);

requestLogger.interappActions = interappActions;

const backtrace = new Backtrace(socket, interappActions);
const errorHandler = new ErrorHandler(
  interappActions,
  backtrace,
  [no_wamp_session_destroyed],
  isProduction,
);

/*
window.addEventListener('error', errorHandler.onError);
window.addEventListener(
  'unhandledrejection',
  errorHandler.onUnhandledRejection,
);*/

// Setup mobx stores
const rootStore = new RootStore(
  interappActions,
  middlewareActions,
  middlewareStorage,
  socket,
  errorHandler,
);

// Setup hardware event listeners
const hardwareEvents = new HardwareEvents();
hardwareEventHandler.handleEvents(hardwareEvents, rootStore);
const mockHardwareEvents = new MockHardwareEvents(hardwareEvents);
mockHardwareEvents.startListening();

ReactDOM.render(
  <StoreProvider store={rootStore}>
    <App />
  </StoreProvider>,
  rootElement,
);


export type IntersectionObserverProps = any;
export type PlainChildrenProps = any;
export type ObserverInstanceCallback = (...args: any[]) => void;
export type InViewHookResponse = any;
export type IntersectionOptions = any;
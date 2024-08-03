import { useState, useEffect, Suspense, lazy, useRef  } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../helpers/ButtonHelper';
import socket, { App, socketData } from '../helpers/WebSocketService';
import Dashboard from './dashboard';
import Web from './web';
import './views.css';


import Overlay from '../components/Overlay/Overlay';
import { AppStore } from '../store';
import ControlHandler, { ControlKeys } from '../store/controlStore';
import Landing from './landing';

const ViewManager = () => {
  const [DynamicComponent, setDynamicComponent] = useState<React.LazyExoticComponent<any> | null>(null);
  const [isWebApp, setIsWebApp] = useState<boolean>(false);
  const appStore = AppStore;
  const [apps, setApps] = useState<App[]>(appStore.getApps());
  const [currentView, setCurrentView] = useState<string>(appStore.getCurrentView());
  const controlHandler = ControlHandler

  const viewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const buttonHelper = ButtonHelper.getInstance();

    const handleButtonPress = (btn: Button, flv: EventFlavour) => {
      if (flv === EventFlavour.Up) {
        switch (btn) {
          case Button.BUTTON_1:
            controlHandler.runControlAction(ControlKeys.Button1);
            break;
            case Button.BUTTON_2:
            controlHandler.runControlAction(ControlKeys.Button2);
            break;
            case Button.BUTTON_3:
            controlHandler.runControlAction(ControlKeys.Button3);
            break;
            case Button.BUTTON_4:
            controlHandler.runControlAction(ControlKeys.Button4);
            break;
          case Button.BUTTON_5:
            
            if (currentView != 'utility') {
              appStore.setCurrentView('dashboard');
            }
            break;
          default:
            break;
        }
      } else if (flv === EventFlavour.LongPress) {
        switch (btn) {
          // Handle long press actions
          case Button.BUTTON_1:
            controlHandler.runControlAction(ControlKeys.Button1Long, 1);
            break;
          case Button.BUTTON_2:
            controlHandler.runControlAction(ControlKeys.Button2Long, 2);
            break;
          case Button.BUTTON_3:
            controlHandler.runControlAction(ControlKeys.Button3Long, 3);
            break;
          case Button.BUTTON_4:
            controlHandler.runControlAction(ControlKeys.Button4Long, 4);
            break;
          case Button.BUTTON_5:
            appStore.setCurrentView('utility');
            break;
          default:
            break;
        }
      } else if (btn === Button.SWIPE) {
        switch (flv) {
          case EventFlavour.LeftSwipe:
            handleSwipe(-1);
            break;
          case EventFlavour.RightSwipe:
            handleSwipe(1);
            break;
          default:
            break;
        }
      }
    };

    const handleSwipe = (direction: number) => {
      const apps = appStore.getApps();
      const currentIndex = apps.findIndex((app) => app.manifest.id === currentView);
      if (currentIndex !== -1) {
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < apps.length) {
          appStore.setCurrentView(apps[newIndex].manifest.id);
        }
      }
    };

    buttonHelper.setCallback(handleButtonPress);

    return () => {
      buttonHelper.setCallback(null);
      buttonHelper.destroy();
    };
  }, [appStore, controlHandler, currentView]);


  

  useEffect(() => {
    const listener = (msg: socketData) => {
      if (msg.type === 'set_view' && typeof msg.data === 'string') {
        //appStore.setCurrentView(msg.data);
      }
    };
    const handleAppUpdate = (data: App[]) => {
      setApps(data);
      setCurrentView(appStore.getCurrentView())
    };
  
    const removeListener = socket.on('client', listener);
    const unsubscribe = appStore.subscribeToAppUpdates(handleAppUpdate);
    return () => {
      removeListener();
      unsubscribe();
    };
  }, [appStore]);

  useEffect(() => {
    const loadDynamicComponent = async () => {
      setCurrentView(appStore.getCurrentView());
      const app = apps.find((app) => app.name === currentView)
      if (currentView && app?.enabled) {
        if (app.manifest.isLocalApp) {
          try {
            const importedComponent = await import(`./${currentView.toLowerCase()}/index.tsx`);
            setDynamicComponent(lazy(() => Promise.resolve({ default: importedComponent.default })));
            setIsWebApp(false);
          } catch (error) {
            console.error(`Error loading component for view: ${currentView}`, error);
          }
        } else if (app.manifest.isWebApp) {
          setDynamicComponent(null);
          setIsWebApp(true);
        }
      } else {
        setDynamicComponent(null);
        setIsWebApp(false)
      }
    };

    loadDynamicComponent();
  }, [appStore, apps, currentView]);

  const renderView = () => {
    if (isWebApp) {
      return (
        <Web currentView={currentView} />
      );
    }
    switch (appStore.getCurrentView()) {
      case 'dashboard':
        return <Dashboard />;
      case 'landing':
        return <Landing />;
      default:
        if (DynamicComponent) {
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <DynamicComponent />
            </Suspense>
          );
        }
        return <div className="h-full w-full pt-44">View not found</div>;
      }
  };

  return (

      <div ref={viewContainerRef} className="h-screen view_container touch-none">
        <Overlay>
          {renderView()}
        </Overlay>
      </div>
    )
};

export default ViewManager;
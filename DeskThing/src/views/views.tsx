import { useState, useEffect, Suspense, lazy, useRef  } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../helpers/ButtonHelper';
import socket, { App, socketData } from '../helpers/WebSocketService';
import Dashboard from './dashboard';
import './views.css';


import Overlay from '../components/Overlay/Overlay';

const ViewManager = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [apps, setApps] = useState<App[]>([]);
  const [DynamicComponent, setDynamicComponent] = useState<React.LazyExoticComponent<any> | null>(null);


  const viewContainerRef = useRef<HTMLDivElement>(null);

  const handleLongPress = (index: number, view: string) => {
    if (socket.is_ready()) {
      const data = {
        app: 'server', // this should match what you have set on eventEmitter
        type: 'set', // This is just for you to specify type (get, set, put, post, etc)
        request: 'add_app',
        data: {app: view, index: index},
      };
      socket.post(data);
    }
  }

  useEffect(() => {
    const buttonHelper = ButtonHelper.getInstance();

    const handleButtonPress = (btn: Button, flv: EventFlavour) => {
      if (flv === EventFlavour.Up) {
        switch (btn) {
          case Button.BUTTON_1:
            setCurrentView(getAppByButtonIndex(1));
            break;
          case Button.BUTTON_2:
            setCurrentView(getAppByButtonIndex(2));
            break;
          case Button.BUTTON_3:
            setCurrentView(getAppByButtonIndex(3));
            break;
          case Button.BUTTON_4:
            setCurrentView(getAppByButtonIndex(4));
            break;
          case Button.BUTTON_5:
            if (currentView != 'utility') {
              setCurrentView('dashboard');
            }
            break;
          default:
            break;
        }
      } else if (flv === EventFlavour.LongPress) {
        switch (btn) {
          // Handle long press actions
          case Button.BUTTON_1:
            handleLongPress(1, currentView);
            break;
          case Button.BUTTON_2:
            handleLongPress(2, currentView);
            break;
          case Button.BUTTON_3:
            handleLongPress(3, currentView);
            break;
          case Button.BUTTON_4:
            handleLongPress(4, currentView);
            break;
          case Button.BUTTON_5:
            setCurrentView('utility');
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

    const getAppByButtonIndex = (index: number): string => {
        if (index <= apps.length) {
          console.log(apps)
          return apps[index -1].name;
        }
      return 'dashboard'; // Default to dashboard if no valid app found
    };

    const handleSwipe = (direction: number) => {
      const currentIndex = apps.findIndex((app) => app.name === currentView);
      if (currentIndex !== -1) {
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < apps.length) {
          setCurrentView(apps[newIndex].name);
        }
      }
    };

    buttonHelper.setCallback(handleButtonPress);

    return () => {
      buttonHelper.setCallback(null);
      buttonHelper.destroy();
    };
  }, [currentView, apps]);


  

  useEffect(() => {
    const listener = (msg: socketData) => {
      if (msg.type === 'set_view' && typeof msg.data === 'string') {
        setCurrentView(msg.data);
      } else if (msg.type === 'config') {
        const data = msg.data as App[];
        // Sort apps based on prefIndex
        data.sort((a, b) => a.prefIndex - b.prefIndex);
        setApps(data);
      }
    };
  
    const removeListener = socket.on('client', listener);
  
    return () => {
      removeListener();
    };
  }, []);

  useEffect(() => {
    const loadDynamicComponent = async () => {
      const app = apps.find((app) => app.name === currentView)
      if (currentView && app?.enabled) {
        if (app.manifest.isLocalApp) {
          try {
            const importedComponent = await import(`./${currentView.toLowerCase()}/index.tsx`);
            setDynamicComponent(lazy(() => Promise.resolve({ default: importedComponent.default })));
          } catch (error) {
            console.error(`Error loading component for view: ${currentView}`, error);
          }
        } else if (app.manifest.isWebApp) {
          // Go to web
        }
      } else {
        setDynamicComponent(null);
      }
    };

    loadDynamicComponent();
  }, [apps, currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'landing':
        return <Dashboard />;
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

      <div ref={viewContainerRef} className="view_container touch-none">
        <Overlay currentView={currentView} apps={apps} setCurrentView={setCurrentView}>
          {renderView()}
        </Overlay>
      </div>
    )
};

export default ViewManager;
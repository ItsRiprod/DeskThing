import {FC, ReactNode, useEffect,  useState } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper.ts';

import './Overlay.css';
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import Volume from '../Volume/Volume'
import AppSelector from '../AppSelector/AppSelector'
import { App } from 'src/helpers/WebSocketService.ts';
interface OverlayProps {
  children: ReactNode;
  currentView: string;
  setCurrentView: (app: string) => void;
  apps: App[];
}

const Overlay: FC<OverlayProps> = ({ children, currentView, apps, setCurrentView }) => {
    const [visible, setVisible] = useState(false);
    const [active, setActive] = useState(false);
    const buttonHelper = ButtonHelper.getInstance();

    useEffect(() => {
        let timer;
        
        const handleTimer = () => {
          setVisible(true); 

          timer = setTimeout(() => {
            setVisible(false);
          }, 1500);
        };
    
        
        handleTimer();
    
        
        return () => clearTimeout(timer);
      }, [currentView]);

      useEffect(() => {
        const handleSwipe = (btn: Button, flv: EventFlavour) => {
          if (btn != null) {

            switch (flv) {
              case EventFlavour.UpSwipe:
                setActive(false);
                setVisible(false);
                break;
                case EventFlavour.DownSwipe:
                  if (visible) {
                    setActive(true);
                  } else {
                    setVisible(true);
                  }
                  break;
                }
              }
        }
    
        buttonHelper.addListener(Button.SWIPE, EventFlavour.UpSwipe, handleSwipe);
        buttonHelper.addListener(Button.SWIPE, EventFlavour.DownSwipe, handleSwipe);
    
        return () => {
          buttonHelper.removeListener(Button.SWIPE, EventFlavour.UpSwipe);
          buttonHelper.removeListener(Button.SWIPE, EventFlavour.DownSwipe);
        };
      }, [buttonHelper, visible]);

      const handleAppSelect = (view: string) => {
        setCurrentView(view);
        setActive(false);
        setVisible(false);
      }
  return <div className="overlay">
      {<AppSelector className={`${active ? 'touched' : ''} ${visible ? 'visible' : ''}`} onAppSelect={handleAppSelect} apps={apps} currentView={currentView}/>}
      <Header />
      <Volume />
          {children}
      <Footer />
    </div>;
};

export default Overlay;

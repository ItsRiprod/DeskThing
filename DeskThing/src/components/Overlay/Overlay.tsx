import {FC, ReactNode, useEffect,  useState } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper.ts';

import './Overlay.css';
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import Volume from '../Volume/Volume'
import AppSelector from '../AppSelector/AppSelector'
interface OverlayProps {
  children: ReactNode;
  preferredApps: Array<string>;
  currentView: string;
  setCurrentView: (app: string) => void;
  apps: string[];
}

const Overlay: FC<OverlayProps> = ({ children, preferredApps, currentView, apps, setCurrentView }) => {
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
      }, [preferredApps, currentView]);

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
    {<AppSelector className={`${active ? 'touched' : ''} ${visible ? 'visible' : ''}`} onAppSelect={handleAppSelect} apps={apps} currentView={currentView} preferredApps={preferredApps}/>}
    <Header />
    <Volume />
        {children}
    <Footer />
    </div>;
};

export default Overlay;

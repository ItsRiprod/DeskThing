import {FC, ReactNode, useEffect,  useState } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper.ts';

import './Overlay.css';
import Footer from '../Footer/Footer'
import Bluetooth from '../Bluetooth'
import Volume from '../Volume/Volume'
import AppSelector from '../AppSelector/AppSelector'
import { AppStore } from '../../store';
interface OverlayProps {
  children: ReactNode;
}

const Overlay: FC<OverlayProps> = ({ children }) => {
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
      }, []);

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
        AppStore.setCurrentView(view);
        setActive(false);
        setVisible(false);
      }
  return <div className="overlay">
      {<AppSelector className={`${active ? 'touched' : ''} ${visible ? 'visible' : ''}`} onAppSelect={handleAppSelect} />}
      <Volume />
          {children}
      <Bluetooth />
      <Footer />
    </div>;
};

export default Overlay;

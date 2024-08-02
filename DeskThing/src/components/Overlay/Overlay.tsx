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
      let timer: NodeJS.Timeout | null = null;
      // Handle visibility timer
      if (active) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setActive(false);
        }, 1500);
      }
      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [active]);
  
    useEffect(() => {
      // Handle swipe events
      const handleSwipe = (btn: Button, flv: EventFlavour) => {
        if (btn != null) {
          switch (flv) {
            case EventFlavour.UpSwipe:
              setVisible(false);
              setActive(false);
              break;
            case EventFlavour.DownSwipe:
              if (active) {
                setVisible(true);
              } else {
                setActive(true);
              }
              break;
          }
        }
      };
  
      buttonHelper.addListener(Button.SWIPE, EventFlavour.UpSwipe, handleSwipe);
      buttonHelper.addListener(Button.SWIPE, EventFlavour.DownSwipe, handleSwipe);
  
      return () => {
        buttonHelper.removeListener(Button.SWIPE, EventFlavour.UpSwipe);
        buttonHelper.removeListener(Button.SWIPE, EventFlavour.DownSwipe);
      };
    }, [buttonHelper, visible, active]);
  
    const handleAppSelect = (view: string) => {
      AppStore.setCurrentView(view);
      setActive(false);
      setVisible(false);
    };
  return <div className="overlay flex-col flex overflow-hidden">
      {<AppSelector active={active} visible={visible} onAppSelect={handleAppSelect} />}
      <Volume />
          {children}
      <Bluetooth />
      <Footer />
    </div>;
};

export default Overlay;

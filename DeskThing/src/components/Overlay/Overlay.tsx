import {FC, ReactNode, useEffect,  useState, useMemo} from 'react';
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
    const buttonHelper = useMemo(() => new ButtonHelper(), []);

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
        const handleButtonPress = (btn: Button, flv: EventFlavour) => {
          if (btn === Button.SWIPE) {
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
        };
    
        const noOpCallback = () => { };
    
        buttonHelper.setCallback(handleButtonPress);
    
        return () => {
          buttonHelper.setCallback(noOpCallback);
        };
      }, [buttonHelper, visible]);

  return <div className="overlay">
    {<AppSelector className={`${active ? 'touched' : ''} ${visible ? 'visible' : ''}`} onAppSelect={setCurrentView} apps={apps} currentView={currentView} preferredApps={preferredApps}/>}
    <Header />
    <Volume />
        {children}
    <Footer />
    </div>;
};

export default Overlay;

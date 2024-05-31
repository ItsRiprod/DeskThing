import { observer } from 'mobx-react-lite';
import Listening from 'component/Listening/Listening';
import Presets from 'component/Presets/Presets';
import { useStore } from 'context/store';
import Modal from 'component/Modals/Modal';
import Overlay, { FROM } from 'component/Overlays/Overlay';
import PhoneCall from 'component/PhoneCall/PhoneCall';
import Promo from 'component/Promo/Promo';

const Overlays = () => {
  const { overlayController } = useStore();

  return (
    <>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('voice')}
      >
        <Listening />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('presets')}
        outDelay={300}
      >
        <Presets />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('phone_call')}
      >
        <PhoneCall />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('promo')}
      >
        <Promo />
      </Overlay>
      <Modal />
    </>
  );
};

export default observer(Overlays);

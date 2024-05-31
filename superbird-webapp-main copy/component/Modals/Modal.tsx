import BluetoothPairing from 'component/Modals/BluetoothPairing';
import LetsDrive from 'component/Modals/LetsDrive';
import LoginRequired from 'component/Modals/LoginRequired';
import NoConnection from 'component/Modals/NoConnection';
import NonSupportedType from 'component/Modals/NonSupportedType';
import PremiumAccountRequired from 'component/Modals/PremiumAccountRequired';
import Standby from 'component/Modals/Standby';
import Overlay, { FROM } from 'component/Overlays/Overlay';
import SavingPresetFailed from 'component/Presets/SavingPresetFailed';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import NoNetwork from 'component/Modals/NoNetwork';

const Modal = () => {
  const { overlayController } = useStore();

  return (
    <>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('lets_drive')}
      >
        <LetsDrive />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('premium_required')}
      >
        <PremiumAccountRequired />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('no_connection')}
      >
        <NoConnection />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('login_required')}
      >
        <LoginRequired />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('bluetooth_pairing')}
      >
        <BluetoothPairing />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('non_supported_type')}
      >
        <NonSupportedType />
      </Overlay>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('standby')}
      >
        <Standby />
      </Overlay>
      <Overlay
        show={overlayController.isShowing('save_preset_error')}
        appear={FROM.FADE_IN}
      >
        <SavingPresetFailed />
      </Overlay>
        <Overlay
            appear={FROM.FADE_IN}
            show={overlayController.isShowing('no_network')}
        >
            <NoNetwork/>
        </Overlay>
    </>
  );
};

export default observer(Modal);

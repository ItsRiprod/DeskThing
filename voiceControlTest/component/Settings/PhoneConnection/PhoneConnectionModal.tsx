import PhoneForgetConfirm from './PhoneForgetConfirm';
import { useEffect } from 'react';
import styles from '../../Modals/Modal.module.scss';
import { useStore } from 'context/store';
import { PhoneConnectionModalView } from 'store/PhoneConnectionStore';
import Spinner, {
  SpinnerSize,
} from '../../CarthingUIComponents/Spinner/Spinner';
import { IconCheck } from '@spotify-internal/encore-web';
import Overlay, { FROM } from '../../Overlays/Overlay';
import { observer } from 'mobx-react-lite';
import PremiumAccountRequired from '../../Modals/PremiumAccountRequired';
import LoginRequired from 'component/Modals/LoginRequired';

const PhoneConnectionModal = () => {
  const { bluetoothStore, phoneConnectionStore } = useStore();

  useEffect(() => {
    phoneConnectionStore.logDialogImpression();
  }, [phoneConnectionStore, phoneConnectionStore.phoneConnectionModal]);

  const getDialog = () => {
    switch (phoneConnectionStore.phoneConnectionModal) {
      case PhoneConnectionModalView.ADD_NEW_PHONE:
        return (
          <>
            <div className={styles.title}>Pairing mode</div>
            <div className={styles.description}>
              {`Go to Bluetooth in your phone’s settings and connect to ${
                bluetoothStore.localDevice
                  ? bluetoothStore.localDevice.name
                  : 'your Car Thing'
              }.`}
            </div>
          </>
        );
      case PhoneConnectionModalView.ADD_NEW_PAIRING:
        return (
          <>
            <div className={styles.title}>Pairing...</div>
            <div className={styles.description}>
              Confirm that you see the code below on your phone.
            </div>
            <div className={styles.pairingCode}>{bluetoothStore.pin}</div>
          </>
        );
      case PhoneConnectionModalView.FORGET_PHONE_CONFIRM:
        return <PhoneForgetConfirm />;
      case PhoneConnectionModalView.FORGET_PHONE_PROGRESS:
        return (
          <>
            <Spinner size={SpinnerSize.BIG} />
            <div
              className={styles.subtitle}
              data-testid="forget-phone-progress"
            >
              <p>Forgetting</p>
              <p>{phoneConnectionStore.phoneToConnectOrForget?.name}...</p>
            </div>
          </>
        );
      case PhoneConnectionModalView.FORGET_PHONE_FAILURE:
        return (
          <>
            <div className={styles.title}>Couldn’t forget phone</div>
            <div className={styles.description}>
              <p>Car Thing is having trouble forgetting your phone.</p>
            </div>
          </>
        );
      case PhoneConnectionModalView.FORGET_PHONE_SUCCESS:
        return (
          <>
            <IconCheck iconSize={24} className={styles.iconCheck} />
            <div className={styles.subtitle} data-testid="forget-phone-success">
              <p>{phoneConnectionStore.phoneToConnectOrForget?.name}</p>
              <p> is forgotten</p>
            </div>
          </>
        );
      case PhoneConnectionModalView.SELECT_PHONE_PROGRESS:
        return (
          <>
            <Spinner size={SpinnerSize.BIG} />
            <div
              className={styles.subtitle}
              data-testid="select-phone-progress"
            >
              <p>Connecting to</p>
              <p>{phoneConnectionStore.phoneToConnectOrForget?.name}...</p>
            </div>
          </>
        );
      case PhoneConnectionModalView.PHONE_SWITCH_SUCCESS:
        return (
          <>
            <IconCheck iconSize={24} className={styles.iconCheck} />
            <div className={styles.subtitle} data-testid="select-phone-success">
              <p>Connected to</p>
              <p>{bluetoothStore.currentDevice?.name}</p>
            </div>
          </>
        );
      case PhoneConnectionModalView.SELECT_PHONE_FAILURE:
        return (
          <>
            <div className={styles.title}>Couldn’t connect to phone</div>
            <div className={styles.description}>
              <p>
                Car Thing is having trouble connecting to your phone. Make sure
                your phone is turned on, Bluetooth is on and in range.
              </p>
            </div>
          </>
        );
      case PhoneConnectionModalView.NEED_PREMIUM:
        return <PremiumAccountRequired />;
      case PhoneConnectionModalView.NOT_LOGGED_IN:
        return <LoginRequired />;
      default:
        return undefined;
    }
  };

  const dialog = getDialog();

  return (
    <Overlay show={!!dialog} appear={FROM.FADE_IN}>
      <div className={styles.dialog}>{dialog}</div>
    </Overlay>
  );
};

export default observer(PhoneConnectionModal);

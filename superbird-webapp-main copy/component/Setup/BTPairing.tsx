import styles from './BTPairing.module.scss';
import { observer } from 'mobx-react-lite';
import { SetupView } from 'store/SetupStore';
import { useStore } from 'context/store';

const parsePincode = (pinCode?: string) => {
  if (!pinCode) return pinCode;

  return pinCode.split('').join(' ');
};
const BTPairing = () => {
  const { bluetoothStore } = useStore();
  return (
    <div
      className={styles.screen}
      data-testid={`${SetupView.BT_PAIRING}-screen`}
    >
      <div className={styles.title}>Pairing code</div>
      <div className={styles.content}>
        <div className={styles.texts}>
          In the Spotify app, confirm that you see the code below.
        </div>
        <div className={styles.pinCode} data-testid="bt-pin">
          {parsePincode(bluetoothStore.bluetoothPairingPin)}
        </div>
      </div>
    </div>
  );
};

export default observer(BTPairing);

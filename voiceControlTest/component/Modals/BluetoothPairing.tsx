import { useEffect } from 'react';
import styles from './Modal.module.scss';
import { useStore } from 'context/store';
import { SpotifyLogo } from 'component/CarthingUIComponents';

const BluetoothPairing = () => {
  const { bluetoothStore, ubiLogger } = useStore();
  useEffect(
    () => ubiLogger.modalUbiLogger.logBluetoothPinPairingImpression(),
    [ubiLogger.modalUbiLogger],
  );

  return (
    <div className={styles.dialog} data-testid="bluetoothpairing-modal-type">
      <SpotifyLogo logoHeight={64} logoColorClass="white" />
      <div className={styles.title}>Pairing...</div>
      <div className={styles.description}>
        Confirm that you see the code below on your phone.
      </div>
      <div className={styles.pairingCode}>{bluetoothStore.pin}</div>
    </div>
  );
};

export default BluetoothPairing;

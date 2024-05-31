import { useEffect, useState } from 'react';
import styles from './StartSetup.module.scss';
import SetUpHelp from './SetupHelp';
import { SetupView } from 'store/SetupStore';
import { useStore } from '../../context/store';

const StartSetup = () => {
  const { bluetoothStore } = useStore();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    bluetoothStore.bluetoothDiscoverable(true);
  });

  const dismissHelp = () => {
    setShowHelp(false);
  };

  if (showHelp) {
    return <SetUpHelp onBackToStart={dismissHelp} />;
  }

  return (
    <div
      className={styles.screen}
      data-testid={`${SetupView.START_SETUP}-screen`}
    >
      <div className={styles.title}>Start setup</div>
      <div className={styles.content}>
        <div className={styles.texts}>
          <div className={styles.subtitle}>
            Point your phone’s camera at this QR code and tap the link that
            appears.
          </div>
          <div
            className={styles.needHelp}
            data-testid="go-to-help"
            onClick={() => setShowHelp(true)}
          >
            Need some help?
          </div>
        </div>
        <div className={styles.qrContainer}>
          <img src="images/setup-qr.svg" alt="" height="192px" width="192px" />
        </div>
      </div>
    </div>
  );
};

export default StartSetup;

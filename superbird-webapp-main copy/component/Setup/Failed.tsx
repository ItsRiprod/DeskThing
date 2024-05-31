import { useState } from 'react';
import styles from './Failed.module.scss';
import { useStore } from 'context/store';
import { SetupView } from 'store/SetupStore';

const Failed = () => {
  const { hardwareStore } = useStore();
  const [rebootSelected, setRebootSelected] = useState(false);
  return (
    <div
      className={styles.screen}
      data-testid={`${SetupView.FAILED}-screen`}
      onClick={() => {
        if (!rebootSelected) {
          hardwareStore.reboot();
          setRebootSelected(true);
        }
      }}
    >
      <div className={styles.title}>Try again</div>
      <div className={styles.subtitle}>
        Car Thing couldn’t finish the update. Make sure your phone has cellular
        reception. Tap the screen anywhere to try again.
      </div>
    </div>
  );
};

export default Failed;

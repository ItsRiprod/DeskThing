import { useStore } from 'context/store';
import { useEffect } from 'react';
import styles from './RestartConfirm.module.scss';
import { Button, ButtonType } from 'component/CarthingUIComponents';

const RestartConfirm = () => {
  const {
    hardwareStore,
    ubiLogger: { settingsUbiLogger },
  } = useStore();

  useEffect(() => {
    settingsUbiLogger.logRestartConfirmDialogImpression();
  }, [settingsUbiLogger]);

  const reboot = () => {
    settingsUbiLogger.logRestartConfirmButtonClick();
    hardwareStore.reboot();
  };

  return (
    <div className={styles.restartConfirm}>
      <div className={styles.title}>Are you sure?</div>
      <div className={styles.description}>
        Tap the button to restart Car Thing.
      </div>
      <Button type={ButtonType.BUTTON_PRIMARY} onClick={reboot}>
        Restart Car Thing
      </Button>
    </div>
  );
};

export default RestartConfirm;

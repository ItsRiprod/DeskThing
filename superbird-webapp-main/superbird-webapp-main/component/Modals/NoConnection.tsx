import { useEffect } from 'react';
import styles from './Modal.module.scss';
import { useStore } from 'context/store';
import { AppView } from 'store/ViewStore';
import { Button, ButtonType } from 'component/CarthingUIComponents';

const NoConnection = () => {
  const {
    settingsStore,
    overlayController: { overlayUiState },
    viewStore,
    onboardingStore,
    ubiLogger,
  } = useStore();

  useEffect(
    () => ubiLogger.modalUbiLogger.logNoConnectionModalImpression(),
    [ubiLogger.modalUbiLogger],
  );

  const handleClick = () => {
    overlayUiState.showSettings();
    settingsStore.showPhoneSettings();
    ubiLogger.modalUbiLogger.logGoToPhoneListClick();
    if (viewStore.appView === AppView.ONBOARDING) {
      onboardingStore.setOnboardingFinished();
    }
  };

  return (
    <div data-testid="no_connection-modal-type" className={styles.dialog}>
      <div className={styles.title}>Phone Disconnected</div>
      <div className={styles.description}>
        <p>
          Car Thing will automatically try to reconnect. You can also tap below
          and choose a phone to reconnect to.
        </p>
      </div>
      <Button type={ButtonType.BUTTON_PRIMARY} onClick={handleClick}>
        Go to phone list
      </Button>
    </div>
  );
};

export default NoConnection;

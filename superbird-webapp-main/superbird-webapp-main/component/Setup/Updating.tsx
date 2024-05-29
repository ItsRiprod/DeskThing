import { useEffect } from 'react';
import styles from './Updating.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';
import { SetupView } from 'store/SetupStore';
import AppendEllipsis from 'component/CarthingUIComponents/AppendEllipsis/AppendEllipsis';

const Updating = () => {
  const { otaStore, setupStore, ubiLogger } = useStore();

  useEffect(() => {
    ubiLogger.modalUbiLogger.logSetupCriticalOtaImpression();
  }, [ubiLogger.modalUbiLogger]);

  return (
    <div className={styles.screen} data-testid={`${SetupView.UPDATING}-screen`}>
      <div className={styles.title}>
        <AppendEllipsis>
          {otaStore.upgrading ? 'Finishing up' : 'Updating'}
        </AppendEllipsis>
      </div>
      <div className={styles.content}>
        <div className={styles.subtitle}>
          {setupStore.isFinished
            ? 'It should only take a couple of minutes'
            : 'Continue with setup in the Spotify app.'}
        </div>
        <div className={styles.progress}>
          {!otaStore.upgrading && `${otaStore.transferPercent || 0}%`}
        </div>
      </div>
    </div>
  );
};

export default observer(Updating);

import { observer } from 'mobx-react-lite';

import styles from './OtaUpdating.module.scss';
import { useStore } from 'context/store';
import AppendEllipsis from 'component/CarthingUIComponents/AppendEllipsis/AppendEllipsis';

const OtaUpdating = () => {
  const { otaStore } = useStore();
  return (
    <div className={styles.background}>
      {otaStore.error ? (
        <>
          <div className={styles.error}>Update failed</div>
          <div className={styles.subtitle}>
            To restart the device and try again, please unplug the power cable,
            then plug it back in.
          </div>
        </>
      ) : (
        <>
          <div className={styles.title} data-testid="critical-ota-screen">
            <AppendEllipsis>Updating</AppendEllipsis>
          </div>
          <div className={styles.subtitle}>
            Please keep Car Thing plugged in and powered on.
          </div>
          {otaStore.transferring && (
            <div
              className={styles.progress}
            >{`${otaStore.transferPercent}%`}</div>
          )}
        </>
      )}
    </div>
  );
};

export default observer(OtaUpdating);

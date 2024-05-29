import { IconArrowRight } from '@spotify-internal/encore-web';
import { useStore } from 'context/store';
import withStore from 'hocs/withStore';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styles from './Start.module.scss';

const Start = () => {
  const { onboardingStore, ubiLogger } = useStore();

  useEffect(() => {
    const effect = () => {
      ubiLogger.onboardingUbiLogger.logStartShown();
      onboardingStore.muteMic(true);
      onboardingStore.playTts('onboarding_start.mp3');
    };
    runInAction(effect);
  }, [ubiLogger.onboardingUbiLogger, onboardingStore]);

  return (
    <div
      className={styles.start}
      onPointerDown={onboardingStore.handleStartClick}
      data-testid="onboarding-start"
    >
      <div className={styles.title}>Car Thing is ready.</div>
      <div className={styles.tourAction}>
        <div className={styles.subtitle}>Take a tour</div>
        <div className={styles.arrowWrapper}>
          <IconArrowRight iconSize={16} />
        </div>
      </div>
    </div>
  );
};

export default withStore(observer(Start));

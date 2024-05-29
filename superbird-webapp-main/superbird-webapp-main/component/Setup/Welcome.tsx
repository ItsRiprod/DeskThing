import { IconArrowRight } from '@spotify-internal/encore-web';
import { useStore } from 'context/store';
import { SetupView } from 'store/SetupStore';
import styles from './Welcome.module.scss';

const Welcome = () => {
  const { setupStore } = useStore();
  return (
    <div className={styles.screen} data-testid={`${SetupView.WELCOME}-screen`}>
      <div className={styles.title}>Welcome to Car Thing.</div>
      <div className={styles.subtitleAndButton}>
        <div className={styles.subtitle}>Get started.</div>
        <div
          className={styles.buttonBackground}
          onPointerDown={setupStore.onContinueArrowClicked}
          data-testid="setup-next"
        >
          <IconArrowRight className={styles.button} iconSize={16} />
        </div>
      </div>
    </div>
  );
};

export default Welcome;

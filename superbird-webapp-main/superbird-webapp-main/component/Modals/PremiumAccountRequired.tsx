import { useEffect } from 'react';
import styles from './Modal.module.scss';

import { SpotifyLogo } from 'component/CarthingUIComponents';
import { useStore } from 'context/store';

const PremiumAccountRequired = () => {
  const { ubiLogger } = useStore();
  useEffect(
    () => ubiLogger.modalUbiLogger.logNeedPremiumModalShown(),
    [ubiLogger.modalUbiLogger],
  );
  return (
    <div data-testid="premiumneeded-modal-type" className={styles.dialog}>
      <SpotifyLogo logoHeight={64} logoColorClass="white" />
      <div className={styles.title}>Need a Premium account</div>
      <div className={styles.description}>
        <p>
          To use Car Thing you need to be logged in to a Spotify Premium or
          Premium Family account on your phone.
        </p>
      </div>
    </div>
  );
};

export default PremiumAccountRequired;

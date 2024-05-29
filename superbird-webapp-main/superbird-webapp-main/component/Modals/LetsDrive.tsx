import { useEffect } from 'react';
import { IconNowPlaying } from '@spotify-internal/encore-web';
import styles from './ModalContent.module.scss';
import classNames from 'classnames';
import { useStore } from 'context/store';
import LegacyModal from 'component/Modals/LegacyModal';

const LetsDrive = () => {
  const { ubiLogger } = useStore();
  useEffect(
    () => ubiLogger.modalUbiLogger.logLetsDriveImpression(),
    [ubiLogger.modalUbiLogger],
  );
  return (
    <LegacyModal>
      <div
        className={classNames(styles.modalRoot, styles.errorModal)}
        data-testid="lets_drive-modal-type"
      >
        <IconNowPlaying
          className={classNames(styles.modalIcon, styles.iconNowPlaying)}
        />
        <div className={styles.modalTitle} data-testid="modal-title">
          Let's drive
        </div>
        <div className={styles.modalText} data-testid="modal-text">
          <span className={styles.boldText}>Press a preset button </span>
          or try
          <br />
          <span className={styles.boldText}>
            {' '}
            &quot;Hey Spotify, play some music&quot;{' '}
          </span>
          to get things going.
        </div>
      </div>
    </LegacyModal>
  );
};

export default LetsDrive;

import { IconExclamationAlt } from '@spotify-internal/encore-web';
import LegacyModal from 'component/Modals/LegacyModal';
import styles from './NonSupportedType.module.scss';

const NonSupportedType = () => {
  return (
    <LegacyModal>
      <div
        className={styles.nonSupportedType}
        data-testid="non_supported_type-modal-type"
      >
        <IconExclamationAlt className={styles.icon} iconSize={64} />
        <div className={styles.text}>
          <span>Song view is not available for radio stations</span>
        </div>
      </div>
    </LegacyModal>
  );
};

export default NonSupportedType;

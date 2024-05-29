import styles from 'component/Modals/Modal.module.scss';
import savingPresetStyles from './SavingPresetFailed.module.scss';

import { IconExclamationAlt } from '@spotify-internal/encore-web';
import Type from 'component/CarthingUIComponents/Type/Type';

const SavingPresetFailed = () => {
  return (
    <div className={styles.dialog}>
      <IconExclamationAlt className={savingPresetStyles.icon} iconSize={64} />
      <div className={styles.description}>
        <Type name="celloBook">
          Could not save preset at this time. <br />
          Try again later.
        </Type>
      </div>
    </div>
  );
};

export default SavingPresetFailed;

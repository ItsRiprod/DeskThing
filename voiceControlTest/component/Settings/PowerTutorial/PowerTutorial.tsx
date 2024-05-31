import { useStore } from 'context/store';
import { useEffect } from 'react';
import styles from './PowerTutorial.module.scss';
import Type from '../../CarthingUIComponents/Type/Type';

const PowerTutorial = () => {
  const {
    ubiLogger: { settingsUbiLogger },
  } = useStore();

  useEffect(() => {
    settingsUbiLogger.logPowerOffTutorialImpression();
  }, [settingsUbiLogger]);

  return (
    <div className={styles.powerTutorial}>
      <Type className={styles.title} name="brioBold">
        Power off/on
      </Type>
      <Type className={styles.description} name="celloBook">
        To power off/on, press and hold the Settings button on top of your
        device.
      </Type>
    </div>
  );
};

export default PowerTutorial;

import { useStore } from 'context/store';
import { useEffect } from 'react';
import styles from './FactoryReset.module.scss';
import { observer } from 'mobx-react-lite';
import {
  Button,
  ButtonGroup,
  ButtonType,
} from 'component/CarthingUIComponents';

const FactoryReset = () => {
  const {
    hardwareStore,
    settingsStore,
    ubiLogger: { settingsUbiLogger },
  } = useStore();

  useEffect(
    () => settingsUbiLogger.logFactoryResetDialogImpression(),
    [settingsUbiLogger],
  );

  useEffect(
    () => settingsStore.setFactoryResetConfirmationIsActive(true),
    [settingsStore],
  );

  const factoryReset = () => {
    settingsUbiLogger.logFactoryResetConfirmButtonClick();
    hardwareStore.factoryReset();
  };

  return (
    <div className={styles.factoryReset}>
      <div className={styles.description}>
        Are you really sure you want to do a factory reset? All data on this
        device will be erased. This cannot be undone.
      </div>
      <ButtonGroup layout="horizontal" style={{ margin: '0 auto' }}>
        <Button
          type={
            settingsStore.factoryResetConfirmationIsActive
              ? ButtonType.BUTTON_PRIMARY
              : ButtonType.BUTTON_SECONDARY
          }
          onClick={factoryReset}
        >
          Delete all
        </Button>
        <Button
          type={
            settingsStore.factoryResetConfirmationIsActive
              ? ButtonType.BUTTON_SECONDARY
              : ButtonType.BUTTON_PRIMARY
          }
          onClick={settingsStore.handleFactoryResetClicked}
        >
          Cancel
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default observer(FactoryReset);

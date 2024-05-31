import { useEffect } from 'react';
import modal_styles from './Modal.module.scss';
import { useStore } from 'context/store';
import {
  Button,
  ButtonGroup,
  ButtonType,
} from 'component/CarthingUIComponents';
import { observer } from 'mobx-react-lite';

const Standby = () => {
  const {
    hardwareStore,
    settingsStore,
    overlayController: { overlayUiState },
    ubiLogger,
  } = useStore();

  useEffect(
    () => ubiLogger.modalUbiLogger.logStandbyImpression(),
    [ubiLogger.modalUbiLogger],
  );

  useEffect(
    () => overlayUiState.setPowerOffConfirmationIsActive(true),
    [overlayUiState],
  );

  const handlePowerClick = () => {
    ubiLogger.modalUbiLogger.logStandbyConfirm();
    hardwareStore.powerOff();
  };

  const handleCancelClick = () => {
    ubiLogger.modalUbiLogger.logStandbyCancel();
    settingsStore.handleBack();
  };

  const renderButtons = () => {
    return (
      <ButtonGroup style={{ width: '360px' }}>
        <Button
          type={
            overlayUiState.powerOffConfirmationIsActive
              ? ButtonType.BUTTON_PRIMARY
              : ButtonType.BUTTON_SECONDARY
          }
          onClick={handlePowerClick}
        >
          Power off
        </Button>
        <Button
          type={
            overlayUiState.powerOffConfirmationIsActive
              ? ButtonType.BUTTON_SECONDARY
              : ButtonType.BUTTON_PRIMARY
          }
          onClick={handleCancelClick}
        >
          Cancel
        </Button>
      </ButtonGroup>
    );
  };

  return (
    <div data-testid="standby-modal-type" className={modal_styles.dialog}>
      {renderButtons()}
    </div>
  );
};

export default observer(Standby);

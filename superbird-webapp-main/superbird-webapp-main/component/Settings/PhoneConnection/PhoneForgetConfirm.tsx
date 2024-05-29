import { useEffect } from 'react';
import styles from '../../Modals/Modal.module.scss';
import { useStore } from 'context/store';
import {
  Button,
  ButtonGroup,
  ButtonType,
} from 'component/CarthingUIComponents';
import { observer } from 'mobx-react-lite';

const PhoneForgetConfirm = () => {
  const {
    phoneConnectionStore,
    remoteControlStore,
    ubiLogger: { settingsUbiLogger },
  } = useStore();

  useEffect(
    () => settingsUbiLogger.logConfirmForgetImpression(),
    [settingsUbiLogger],
  );

  const isConnected = remoteControlStore.isConnectedPhone(
    phoneConnectionStore.phoneToConnectOrForget?.address,
  );

  return (
    <div>
      <div className={styles.title} data-testid="confirm-forget-title">
        Forget phone?
      </div>
      <div className={styles.description}>
        {isConnected ? (
          <p>
            You’re connected to{' '}
            {phoneConnectionStore.phoneToConnectOrForget?.name}. Are you sure
            you want to forget it?
          </p>
        ) : (
          <p>
            Are you sure you want to forget{' '}
            {phoneConnectionStore.phoneToConnectOrForget?.name}?
          </p>
        )}
      </div>

      <ButtonGroup layout="horizontal" style={{ margin: '0 auto' }}>
        <Button
          type={
            phoneConnectionStore.forgetConfirmationIsActive
              ? ButtonType.BUTTON_PRIMARY
              : ButtonType.BUTTON_SECONDARY
          }
          onClick={phoneConnectionStore.handlePhoneForgetConfirmClick}
        >
          Forget
        </Button>
        <Button
          type={
            phoneConnectionStore.forgetConfirmationIsActive
              ? ButtonType.BUTTON_SECONDARY
              : ButtonType.BUTTON_PRIMARY
          }
          onClick={() => {
            settingsUbiLogger.logForgetCancelClick();
            phoneConnectionStore.dismissModal();
          }}
        >
          Cancel
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default observer(PhoneForgetConfirm);

import { observer } from 'mobx-react-lite';
import {
  Button,
  ButtonType,
  IconPublic,
  Type,
} from 'component/CarthingUIComponents';
import styles from './NoNetwork.module.scss';
import { useStore } from 'context/store';

type Props = {
  onAcknowledgeClick: () => void;
};

export const NoNetwork = ({ onAcknowledgeClick }: Props): JSX.Element => (
  <div className={styles.noNetworkWrapper} data-testid="no_network-modal-type">
    <div className={styles.noNetwork}>
      <div className={styles.noNetworkContent}>
        <IconPublic iconSize={64} />
        <Type name="brioBold">No network</Type>
        <Type name="celloBook">
          Make sure cellular data is turned on in your phone’s Settings. We’ll
          let you know when you’re back online.
        </Type>
      </div>
      <Button onClick={onAcknowledgeClick} type={ButtonType.BUTTON_SECONDARY}>
        Got it
      </Button>
    </div>
  </div>
);

const NoNetworkContainer = (): JSX.Element => {
  const { overlayController } = useStore();

  function onAcknowledgeClick(): void {
    overlayController.overlayUiState.dismissedNoNetwork = true;
    overlayController.resetAndMaybeShowAModal();
  }

  return <NoNetwork onAcknowledgeClick={onAcknowledgeClick} />;
};

export default observer(NoNetworkContainer);

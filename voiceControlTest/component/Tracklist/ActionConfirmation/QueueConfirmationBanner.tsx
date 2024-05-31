import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';
import Banner from 'component/CarthingUIComponents/Banner/Banner';
import { IconCheck32 } from 'component/CarthingUIComponents';

const QueueConfirmationBanner = () => {
  const uiState = useStore().tracklistStore.tracklistUiState;

  return (
    <Banner
      show={uiState.shouldShowQueueConfirmation}
      icon={<IconCheck32 />}
      infoText="Added to Queue."
      colorStyle="confirmation"
    />
  );
};

export default observer(QueueConfirmationBanner);

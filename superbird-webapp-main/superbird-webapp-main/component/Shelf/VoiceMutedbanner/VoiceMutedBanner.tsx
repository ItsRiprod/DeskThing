import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';
import Banner from 'component/CarthingUIComponents/Banner/Banner';
import BannerButton from 'component/CarthingUIComponents/Banner/BannerButton';
import { IconMicOff32 } from 'component/CarthingUIComponents';
import { useEffect } from 'react';
import { runInAction } from 'mobx';

const VoiceMutedBanner = () => {
  const uiState = useStore().shelfStore.shelfController.voiceMuteBannerUiState;

  useEffect(() => {
    runInAction(() => {
      if (uiState.shouldShowAlert) {
        uiState.logImpression();
      }
    });
  });

  const infoText = 'Turn on your mic to make voice requests.';

  const icon = <IconMicOff32 />;

  return (
    <Banner show={uiState.shouldShowAlert} icon={icon} infoText={infoText}>
      <BannerButton
        text="Turn on mic"
        withDivider
        onClick={() => uiState.handleClickUnmute()}
      />
    </Banner>
  );
};

export default observer(VoiceMutedBanner);

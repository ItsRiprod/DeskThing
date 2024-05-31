import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';
import Banner from 'component/CarthingUIComponents/Banner/Banner';
import BannerButton from 'component/CarthingUIComponents/Banner/BannerButton';
import { IconWind32 } from 'component/CarthingUIComponents';
import { useEffect } from 'react';
import { runInAction } from 'mobx';

const WindAlertBanner = () => {
  const uiState =
    useStore().airVentInterferenceController.windAlertBannerUiState;

  useEffect(() => {
    runInAction(() => {
      if (uiState.shouldShowAlert) {
        uiState.logImpression();
      }
    });
  }, [uiState]);

  const infoText = 'Your air vent noise level is high.';

  const icon = <IconWind32 />;

  return (
    <Banner show={uiState.shouldShowAlert} icon={icon} infoText={infoText}>
      <BannerButton
        text="How to fix"
        withDivider
        onClick={() => uiState.handleClickHowToFix()}
      />
      <BannerButton
        text="Hide"
        withDivider
        onClick={() => uiState.handleClickHide()}
      />
    </Banner>
  );
};

export default observer(WindAlertBanner);

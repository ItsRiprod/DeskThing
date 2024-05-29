import Views from 'component/Views/Views';
import { useStore } from './context/store';
import { useEffect } from 'react';
import SwipeDownHandle from 'component/SwipeDownHandle/SwipeDownHandle';
import Overlays from 'component/Overlays/Overlays';
import { action } from 'mobx';

const Main = () => {
  const { npvStore, shelfStore, overlayController, viewStore } = useStore();

  useEffect(() => {
    setTimeout(() => overlayController.maybeShowAModal(), 2000);
  }, [overlayController]);

  const handlePointerDown = action(() => {
    if (viewStore.isNpv && !overlayController.anyOverlayIsShowing) {
      npvStore.tipsUiState.dismissVisibleTip();
    }
  });

  const handleClick = action(() => {
    shelfStore.shelfController.voiceMuteBannerUiState.dismissVoiceBanner();
  });

  return (
    <div onPointerDown={handlePointerDown} onClick={handleClick}>
      <Views />
      <Overlays />
      <SwipeDownHandle />
    </div>
  );
};

export default Main;

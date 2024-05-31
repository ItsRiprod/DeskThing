import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import AmbientBackdrop from 'component/AmbientBackdrop/AmbientBackdrop';
import ShelfHeader from 'component/Shelf/ShelfHeader/ShelfHeader';

import './Shelf.scss';
import { useStore } from 'context/store';
import ShelfSwiper from 'component/Shelf/ShelfSwiper/ShelfSwiper';
import VoiceMutedBanner from 'component/Shelf/VoiceMutedbanner/VoiceMutedBanner';

const getGradientBackground = (rgbChannels: number[]): string => {
  return `radial-gradient(ellipse at 100px -200px, rgb(${rgbChannels.join(
    ',',
  )}) 5%, black 60%)`;
};

const Shelf = () => {
  const { shelfStore, playerStore, ubiLogger } = useStore();

  useEffect(() => {
    shelfStore.getShelfData();
    ubiLogger.contentShelfUbiLogger.logImpression();
  }, [shelfStore, ubiLogger.contentShelfUbiLogger]);

  return (
    <>
      <AmbientBackdrop
        imageId={playerStore.currentImageId}
        getBackgroundStyleAttribute={getGradientBackground}
      />
      <div id="shelf" data-testid="shelf">
        <ShelfHeader />
        <ShelfSwiper />
        <VoiceMutedBanner />
      </div>
    </>
  );
};

export default observer(Shelf);

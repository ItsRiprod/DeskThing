import AmbientBackdrop from 'component/AmbientBackdrop/AmbientBackdrop';
import PlayingInfoOrTip from 'component/Npv/PlayingInfoOrTip/PlayingInfoOrTip';
import Controls from 'component/Npv/ControlButtons/Controls';
import PodcastSpeedOptions from 'component/Npv/PodcastSpeedOptions/PodcastSpeedOptions';
import Scrubbing from 'component/Npv/Scrubbing/Scrubbing';
import ScrubbingBackdrop from 'component/Npv/Scrubbing/ScrubbingBackdrop';
import Volume from 'component/Npv/Volume/Volume';
import WindAlertBanner from 'component/Npv/WindAlertBanner/WindAlertBanner';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import { transitionDurationMs } from 'style/Variables';
import styles from './Npv.module.scss';
import OtherMedia from 'component/Npv/OtherMedia/OtherMedia';
import NoNetworkBanner from 'component/Npv/NoNetworkBanner/NoNetworkBanner';

const transitionStyles = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
};

const getBackgroundColorFromChannels = (rgbChannels: number[]): string => {
  return `rgb(${rgbChannels.join(',')})`;
};

const Npv = () => {
  const { npvStore, ubiLogger, queueStore, playerStore } = useStore();

  useEffect(() => {
    ubiLogger.npvUbiLogger.logImpression();
  }, [ubiLogger.npvUbiLogger]);

  return (
    <>
      {playerStore.isPlayingSpotify && (
        <AmbientBackdrop
          imageId={queueStore.current.image_uri}
          getBackgroundStyleAttribute={getBackgroundColorFromChannels}
        />
      )}
      <div className={styles.npv} data-testid="npv-container">
        {playerStore.isPlayingSpotify ? <PlayingInfoOrTip /> : <OtherMedia />}
        {playerStore.isPlayingSpotify && <Scrubbing />}
        <div className={styles.controlsContainer}>
          <CSSTransition
            in={!npvStore.volumeUiState.shouldShowVolume}
            timeout={transitionDurationMs}
            classNames={transitionStyles}
            unmountOnExit
          >
            <Controls />
          </CSSTransition>
          <CSSTransition
            in={npvStore.volumeUiState.shouldShowVolume}
            timeout={transitionDurationMs}
            classNames={transitionStyles}
            unmountOnExit
          >
            <Volume />
          </CSSTransition>
        </div>
        <WindAlertBanner />
        <NoNetworkBanner />
        <ScrubbingBackdrop />
      </div>
      <PodcastSpeedOptions />
    </>
  );
};

export default observer(Npv);

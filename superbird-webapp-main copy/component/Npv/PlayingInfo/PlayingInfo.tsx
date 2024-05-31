import Artwork from 'component/Npv/PlayingInfo/Artwork';
import PlayingInfoHeader from 'component/Npv/PlayingInfo/PlayingInfoHeader';
import PlayingInfoTitles from 'component/Npv/PlayingInfo/PlayingInfoTitles/PlayingInfoTitles';
import { SwipeDirection } from 'component/Npv/SwipeHandler';
import StatusIcons from 'component/Npv/PlayingInfo/StatusIcons';

import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { useSwipeable } from 'react-swipeable';
import styles from './PlayingInfo.module.scss';

const PlayingInfo = () => {
  const uiState = useStore().npvStore.playingInfoUiState;

  const getAnimationEnterDirection = (): string | undefined => {
    switch (uiState.swipeHandler.swipeDirection) {
      case SwipeDirection.LEFT:
        return styles.animationEnterRight;
      case SwipeDirection.RIGHT:
        return styles.animationEnterLeft;
      default:
        return undefined;
    }
  };

  const getAnimationExitDirection = (): string | undefined => {
    switch (uiState.swipeHandler.swipeDirection) {
      case SwipeDirection.LEFT:
        return styles.animationExitLeft;
      case SwipeDirection.RIGHT:
        return styles.animationExitRight;
      default:
        return undefined;
    }
  };

  const getAnimationClassNames = () => {
    return {
      enter: getAnimationEnterDirection(),
      enterActive: styles.animationEnterActive,
      exit: styles.animationExit,
      exitActive: getAnimationExitDirection(),
    };
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: uiState.swipeHandler.handleSwipedLeft,
    onSwipedRight: uiState.swipeHandler.handleSwipedRight,
  });

  const tracks = [uiState.currentItem];

  return (
    <div
      className={styles.playingInfo}
      {...swipeHandlers}
      data-testid="npv-playing-info"
    >
      <Artwork
        tracks={tracks}
        getAnimationClassNames={getAnimationClassNames}
      />
      <div className={styles.info}>
        <div className={styles.playingInfoHeader}>
          <PlayingInfoHeader />
          <StatusIcons />
        </div>
        <PlayingInfoTitles
          tracks={tracks}
          getAnimationClassNames={getAnimationClassNames}
        />
      </div>
    </div>
  );
};

export default observer(PlayingInfo);

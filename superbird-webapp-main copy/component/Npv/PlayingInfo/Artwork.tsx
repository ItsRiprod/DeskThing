import LazyImage from 'component/LazyImage/LazyImage';
import { SwipeDirection } from 'component/Npv/SwipeHandler';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { cloneElement, useEffect, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { CSSTransitionClassNames } from 'react-transition-group/CSSTransition';
import { QueueItem } from 'store/QueueStore';
import { transitionDurationMs } from 'style/Variables';
import styles from './Artwork.module.scss';

type Props = {
  tracks: Array<QueueItem>;
  getAnimationClassNames: () => CSSTransitionClassNames;
};

const Artwork = ({ tracks, getAnimationClassNames }: Props) => {
  const uiState = useStore().npvStore.playingInfoUiState;

  const lastImageUri = useRef(uiState.currentItem.image_uri);
  const doAnimate =
    uiState.swipeHandler.swipeDirection !== SwipeDirection.NONE &&
    lastImageUri.current !== uiState.currentItem.image_uri;

  useEffect(() => {
    lastImageUri.current = uiState.currentItem.image_uri;
  }, [uiState.currentItem.image_uri]);

  useEffect(() => {
    uiState.loadPrevAndNextImage();
  }, [uiState, uiState.previousItem?.image_uri, uiState.nextItem?.image_uri]);

  return (
    <div className={styles.artwork}>
      <TransitionGroup
        className={styles.artworkTransitionGroup}
        enter={doAnimate}
        //@ts-ignore
        childFactory={(child) => {
          return cloneElement(child, {
            timeout: transitionDurationMs,
            exit: doAnimate,
            classNames: getAnimationClassNames(),
          });
        }}
      >
        {tracks.map((track) => (
          <CSSTransition
            key={track.uid}
            timeout={transitionDurationMs}
            onEntering={() =>
              uiState.swipeHandler.setSwipeDirection(SwipeDirection.NONE)
            }
          >
            <div className={styles.transitionContainer}>
              <LazyImage
                uri={track.uri}
                size={248}
                imageId={track.image_uri}
                onClick={uiState.handleArtworkClick}
                dataTestId="npv-artwork"
              />
            </div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
};

export default observer(Artwork);

import classNames from 'classnames';
import { SwipeDirection } from 'component/Npv/SwipeHandler';
import { useStore } from 'context/store';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { cloneElement, createRef, useEffect, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { CSSTransitionClassNames } from 'react-transition-group/CSSTransition';
import { QueueItem } from 'store/QueueStore';
import { transitionDurationMs } from 'style/Variables';
import styles from './PlayingInfoTitles.module.scss';

type Props = {
  tracks: Array<QueueItem>;
  getAnimationClassNames: () => CSSTransitionClassNames;
};

const NPV_TITLE_MAX_HEIGHT = 146;

enum TitleSize {
  BIG = 'big',
  MIDDLE = 'middle',
  SMALL = 'small',
}

const PlayingInfoTitle = ({ tracks, getAnimationClassNames }: Props) => {
  const uiState = useStore().npvStore.playingInfoUiState;

  const [showTitle, setShowTitle] = useState(true);
  const [titleSize, setTitleSize] = useState(TitleSize.BIG);
  // Keeping a copy of the title to be able to compare title div size on rerender.
  const [refTitle, setRefTitle] = useState('');
  const npvTitleRef = createRef<HTMLDivElement>();

  useEffect(() => {
    const effect = () => {
      const preRenderDiv = npvTitleRef.current;
      if (uiState.title !== refTitle) {
        setRefTitle(uiState.title);
        setShowTitle(false);
        setTitleSize(TitleSize.BIG);
      }
      if (preRenderDiv && preRenderDiv.offsetHeight > NPV_TITLE_MAX_HEIGHT) {
        if (titleSize === TitleSize.BIG) {
          setTitleSize(TitleSize.MIDDLE);
        } else if (titleSize === TitleSize.MIDDLE) {
          setTitleSize(TitleSize.SMALL); // show title small final
          setShowTitle(true);
        }
      } else {
        // show title final for middle / big
        setShowTitle(true);
      }
    };
    runInAction(effect);
  }, [npvTitleRef, refTitle, uiState.title, titleSize, showTitle]);

  return (
    <TransitionGroup
      className={styles.texts}
      enter={uiState.swipeHandler.swipeDirection !== SwipeDirection.NONE}
      //@ts-ignore
      childFactory={(child) => {
        return cloneElement(child, {
          timeout: transitionDurationMs,
          exit: uiState.swipeHandler.swipeDirection !== SwipeDirection.NONE,
          classNames: getAnimationClassNames(),
        });
      }}
    >
      {tracks.map((track) => (
        <CSSTransition
          key={track.uid}
          timeout={transitionDurationMs}
          className={styles.transitionContainer}
          onEntering={() =>
            uiState.swipeHandler.setSwipeDirection(SwipeDirection.NONE)
          }
        >
          <div className={styles.texts}>
            {showTitle && (
              <div
                className={classNames(styles.songTitle, {
                  [styles.songTitleBig]: titleSize === TitleSize.BIG,
                  [styles.songTitleMiddle]: titleSize === TitleSize.MIDDLE,
                  [styles.songTitleSmall]: titleSize === TitleSize.SMALL,
                })}
                data-testid="npv-track-title"
                ref={npvTitleRef}
              >
                {uiState.title}
              </div>
            )}
            <div
              className={styles.artistTitle}
              data-testid="npv-artist-title"
              onClick={uiState.handleArtistClick}
            >
              {uiState.subtitle}
            </div>
          </div>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
};

export default observer(PlayingInfoTitle);

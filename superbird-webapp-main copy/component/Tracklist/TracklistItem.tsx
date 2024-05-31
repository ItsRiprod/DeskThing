import {
  IconDownloadAltActive,
  IconCheckAltActive,
  IconAddToQueue,
} from '@spotify-internal/encore-web';
import classNames from 'classnames';
import LazyImage from 'component/LazyImage/LazyImage';
import ProgressBar from './ProgressBar';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { TrackItem } from 'component/Tracklist/TracklistUiState';
import pointerListenersMaker from 'helpers/PointerListeners';

import styles from './TracklistItem.module.scss';
import { useStore } from 'context/store';
import { action } from 'mobx';
import { useInView } from 'react-intersection-observer';
import Trailer from 'component/CarthingUIComponents/Trailer/Trailer';
import Type from 'component/CarthingUIComponents/Type/Type';

type Props = {
  item: TrackItem;
  isActive?: boolean;
};

const TracklistItem = ({ item, isActive = false }: Props) => {
  const [pressed, setPressed] = useState(false);

  const { ref, inView } = useInView();

  const uiState = useStore().tracklistStore.tracklistUiState;

  const showImage = !uiState.isPodcastOrAlbum;
  const isPodcast = uiState.isPodcastContext;
  const canCompareUid = item.uid && uiState.currentPlayingTrackUid;
  const isCurrent =
    uiState.browsingCurrentContext &&
    (canCompareUid
      ? item.uid === uiState.currentPlayingTrackUid
      : item.uri === uiState.currentPlayingTrackUri);

  const metadata = item.metadata;

  const handleTrackRowClicked = action(() => {
    const id = uiState.logTrackRowClicked(item);
    uiState.handleItemSelected(item, id);
  });

  useEffect(() => {
    if (inView) {
      uiState.logContextItemImpression(item);
    }
  }, [inView, uiState, item]);

  return (
    <div
      ref={ref}
      className={classNames(styles.tracklistItem, {
        [styles.active]: isActive,
        [styles.pressed]: pressed || (isActive && uiState.isDialPressed),
      })}
      onClick={handleTrackRowClicked}
      {...pointerListenersMaker(setPressed)}
      data-testid={`tracklist-item-${item.uri}`}
    >
      {showImage && (
        <div className={styles.imageContainer}>
          <div className={styles.image} data-testid={`track-image-${item.uri}`}>
            <LazyImage
              uri={item.uri}
              size={96}
              scale={1.3}
              imageId={item.image_id}
              isActive={isActive}
            />
          </div>
        </div>
      )}
      <div
        className={classNames(styles.trackInfo, {
          [styles.showImage]: showImage,
        })}
        data-testid={`track-info-${item.uri}`}
      >
        <Type
          name="canonBold"
          className={classNames(styles.title, {
            [styles.currentlyPlaying]: isCurrent,
          })}
          dataTestId={`${isActive ? 'track-title' : ''}`}
        >
          {item.title}
        </Type>
        <div className={styles.subtitleContainer}>
          {item.available_offline && (
            <IconDownloadAltActive className={styles.downloaded} />
          )}
          {item.isTrailer && <Trailer />}
          {metadata?.is_explicit_content && (
            <img
              src="images/explicit.svg"
              alt="explicit"
              className={styles.explicit}
            />
          )}
          <Type
            name="balladBook"
            className={styles.subtitle}
            dataTestId={`${isActive ? 'track-subtitle' : ''}`}
          >
            {item.subtitle}
          </Type>
          {isPodcast && metadata?.is_played && (
            <IconCheckAltActive className={styles.playedIcon} />
          )}
          {isPodcast && <ProgressBar item={item} isCurrent={isCurrent} />}
        </div>
      </div>
      <div
        className={styles.addToQueue}
        onClick={(event) => uiState.clickAddToQueue(event, item)}
        data-testid={`${item.uri}-add-to-queue`}
      >
        <IconAddToQueue className={styles.addToQueueIcon} />
      </div>
    </div>
  );
};

export default observer(TracklistItem);

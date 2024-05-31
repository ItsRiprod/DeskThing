import classNames from 'classnames';
import LazyImage from 'component/LazyImage/LazyImage';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import styles from './TracklistHeaderDetails.module.scss';

const TracklistHeaderDetails = () => {
  const {
    isAlbumContext: isAlbum,
    isPlayListContext: isPlaylist,
    isPodcastContext: isPodcast,
    tracksList,
    smallHeader,
    contextUri,
    contextImage,
    contextTitle,
    totalInContext,
  } = useStore().tracklistStore.tracklistUiState;

  const trackListLength = tracksList.length;
  const tracklistSuffix = trackListLength !== 1 ? 's' : '';
  const showSubtitle = (isPlaylist || isPodcast) && trackListLength > 0;
  const showImage = isAlbum || isPodcast;

  const showOnlyTitle = !showSubtitle && !showImage;
  const showImageTitle = showImage && !showSubtitle;
  const showImageTitleSubtitle = showImage && showSubtitle;
  const showTitleSubtitle = !showImage && showSubtitle;

  return (
    <div className={styles.infoWrapper}>
      {showImage && (
        <div
          className={classNames(styles.imageWrapper, {
            [styles.smallHeader]: smallHeader,
          })}
        >
          <LazyImage
            uri={contextUri}
            size={96}
            scale={1.3}
            imageId={contextImage}
          />
        </div>
      )}
      <div
        className={classNames(styles.titles, {
          [styles.moveUp]: smallHeader && showOnlyTitle,
          [styles.moveLeftAndDown]: smallHeader && showImageTitleSubtitle,
          [styles.moveLeftAndUp]: smallHeader && showImageTitle,
          [styles.moveDown]: smallHeader && showTitleSubtitle,
        })}
      >
        <div
          className={classNames(styles.tracklistTitle, {
            [styles.smallHeader]: smallHeader,
          })}
          data-testid="tracklist-header-title"
        >
          {contextTitle}
        </div>
        {showSubtitle && (
          <div
            className={classNames(styles.trackCount, {
              [styles.smallHeader]: smallHeader,
            })}
            data-testid="tracklist-header-info-count"
          >
            <span>{`${totalInContext} ${
              isPodcast ? 'episode' : 'song'
            }${tracklistSuffix}`}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(TracklistHeaderDetails);

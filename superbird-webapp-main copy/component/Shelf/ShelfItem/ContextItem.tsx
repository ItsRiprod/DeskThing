import classNames from 'classnames';
import LazyImage from 'component/LazyImage/LazyImage';
import { ARTWORK_WIDTH } from 'component/Shelf/ShelfItem/ShelfSwiperItem';
import styles from 'component/Shelf/ShelfItem/ShelfSwiperItem.module.scss';
import { useStore } from 'context/store';
import { getShelfItemTitle } from 'helpers/ContextTitleExtractor';
import pointerListenersMaker from 'helpers/PointerListeners';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { ShelfItem } from 'store/ShelfStore';
import shelfSwiperItemStyles from './ShelfSwiperItem.module.scss';
import NowPlaying from 'component/CarthingUIComponents/NowPlaying/NowPlaying';

type Props = {
  item: ShelfItem;
  isActive: boolean;
};

const ContextItem = ({ item, isActive }: Props) => {
  const uiState = useStore().shelfStore.shelfController.shelfSwiperItemUiState;
  const { uri, image_id: imageId, title, subtitle, category } = item;

  const { ref, inView } = useInView();
  const [touchDown, setTouchDown] = useState(false);

  useEffect(() => {
    if (inView) {
      runInAction(() => {
        uiState.logContextItemImpression(uri, category);
      });
    }
  }, [category, uiState, inView, uri]);

  const handleArtworkClicked = useCallback(() => {
    uiState.artworkClicked(item);
  }, [item, uiState]);

  return (
    <div
      ref={ref}
      className={classNames(styles.item, {
        [shelfSwiperItemStyles.activeSlide]: isActive,
        [shelfSwiperItemStyles.pressed]:
          touchDown || (isActive && uiState.isDialPressed),
      })}
      {...pointerListenersMaker(setTouchDown)}
      onClick={handleArtworkClicked}
      data-testid={`artwork-${item.uri}`}
    >
      <LazyImage
        dataTestId={`shelf-image-${item.uri}`}
        size={ARTWORK_WIDTH}
        imageId={imageId}
        uri={uri || ''}
        innerBorder
        isActive={isActive}
      />
      <div
        className={styles.titleContainer}
        data-testid={isActive ? 'selected-item-title' : ''}
      >
        <div className={styles.title}>
          {uiState.graphQlEnabled ? title : getShelfItemTitle(title, uri)}
        </div>
      </div>
      <div
        className={styles.subtitle}
        data-testid={isActive ? 'selected-item-subtitle' : ''}
      >
        {uiState.showNowPlaying(uri) ? (
          <NowPlaying playing={uiState.isPlaying} textName="balladBook" />
        ) : (
          subtitle
        )}
      </div>
    </div>
  );
};

export default observer(ContextItem);

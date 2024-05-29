import pointerListenersMaker from 'helpers/PointerListeners';
import { IconChevronRight48 } from 'component/CarthingUIComponents';
import { ShelfItem } from 'store/ShelfStore';
import { useStore } from 'context/store';
import { useEffect, useState } from 'react';
import { runInAction } from 'mobx';
import { useInView } from 'react-intersection-observer';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import styles from './ShelfSwiperItem.module.scss';
import moreStyles from './MoreButton.module.scss';
import Type from 'component/CarthingUIComponents/Type/Type';

type Props = {
  isActive: boolean;
  item: ShelfItem;
};

const MoreItem = ({ isActive, item }: Props) => {
  const { category, title } = item;
  const { ref, inView } = useInView();
  const uiState = useStore().shelfStore.shelfController.shelfSwiperItemUiState;
  const [touchDown, setTouchDown] = useState(false);

  useEffect(() => {
    if (inView) {
      runInAction(() => {
        uiState.logMoreItemImpression(category);
      });
    }
  }, [category, uiState, inView]);

  return (
    <div
      ref={ref}
      className={classNames(styles.buttonItem, {
        [styles.activeSlide]: isActive,
        [styles.pressed]: (uiState.isDialPressed && isActive) || touchDown,
      })}
      onClick={() => uiState.moreButtonClicked(item.category)}
      data-testid={`contentshelf-more-${category}`}
    >
      {isActive && <div className={styles.activeBorder} />}
      <div
        className={styles.buttonArtwork}
        {...pointerListenersMaker(setTouchDown)}
      />
      <div className={`${moreStyles.moreIcon} ${styles.artworkCenter}`} />
      <div className={styles.artworkCenter} data-testid="more-button">
        <IconChevronRight48 />
      </div>

      <div
        className={styles.titleContainer}
        data-testid={isActive ? 'selected-item-title' : ''}
      >
        <Type name="celloBold" className={styles.title}>
          {title ?? 'More'}
        </Type>
      </div>
    </div>
  );
};

export default observer(MoreItem);

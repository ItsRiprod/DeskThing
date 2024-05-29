import classNames from 'classnames';
import { useStore } from 'context/store';
import pointerListenersMaker from 'helpers/PointerListeners';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { ShelfItem } from 'store/ShelfStore';
import { IconMicOn64, IconMicOff64 } from 'component/CarthingUIComponents';
import Type from 'component/CarthingUIComponents/Type/Type';
import { useInView } from 'react-intersection-observer';
import { runInAction } from 'mobx';
import styles from 'component/Shelf/ShelfItem/ShelfSwiperItem.module.scss';

type Props = {
  item: ShelfItem;
  isActive: boolean;
};

const DefaultVoiceItem = ({ item, isActive }: Props) => {
  const uiState = useStore().shelfStore.shelfController.shelfSwiperItemUiState;
  const { category } = item;

  const { ref, inView } = useInView();
  const [touchDown, setTouchDown] = useState(false);

  useEffect(() => {
    if (inView) {
      runInAction(() => {
        uiState.logPushToTalkVoiceItemImpression(category);
      });
    }
  }, [category, uiState, inView]);

  const handlePushToTalkClicked = (e) => {
    // to cancel the dismiss banner on click main and swiper
    // if clicking on item again
    e.stopPropagation();
    uiState.pushToTalkClicked(item);
  };

  return (
    <div
      ref={ref}
      className={classNames(styles.buttonItem, {
        [styles.activeSlide]: isActive,
        [styles.pressed]: (uiState.isDialPressed && isActive) || touchDown,
        [styles.notEnabled]: !uiState.isMicEnabled,
      })}
      onClick={(e) => handlePushToTalkClicked(e)}
    >
      {isActive && (
        <div className={`${styles.activeBorder} ${styles.circle}`} />
      )}
      <div
        className={`${styles.buttonArtwork} ${styles.circle}`}
        {...pointerListenersMaker(setTouchDown)}
      />
      <div
        className={`${styles.buttonIcon} ${styles.artworkCenter}`}
        data-testid={uiState.isMicEnabled ? 'voice-on-icon' : 'voice-off-icon'}
      >
        {uiState.isMicEnabled ? <IconMicOn64 /> : <IconMicOff64 />}
      </div>

      <div
        className={styles.titleContainer}
        data-testid={isActive ? 'selected-item-title' : ''}
      >
        <Type name="celloBold" className={styles.title}>
          Tap to use voice
        </Type>
      </div>
    </div>
  );
};

export default observer(DefaultVoiceItem);

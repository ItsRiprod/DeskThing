import { useSwiperDial } from 'hooks/useSwiperDial';
import { useStore } from 'context/store';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { ShelfItem } from 'store/ShelfStore';
import { transitionDurationMs } from 'style/Variables';
import { Virtual, Swiper as SwiperCore } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import ShelfSwiperItem, { ARTWORK_WIDTH } from '../ShelfItem/ShelfSwiperItem';
import 'swiper/scss';
import styles from './ShelfSwiper.module.scss';
import { useState } from 'react';

SwiperCore.use([Virtual]);

const SWIPER_WIDTH = 800;
const SWIPER_OFFSET_BEFORE = 50;
const SWIPER_SPACE_BETWEEN = 32;
const SWIPER_OFFSET_AFTER =
  SWIPER_WIDTH - ARTWORK_WIDTH - SWIPER_OFFSET_BEFORE + 2; // 2px for swiper end not to break

const THREE_ARTWORK_WIDTH = 3 * ARTWORK_WIDTH + 2 * SWIPER_SPACE_BETWEEN;
const SWIPER_SLIDES_PER_VIEW =
  3 +
  (SWIPER_WIDTH - THREE_ARTWORK_WIDTH) / (ARTWORK_WIDTH + SWIPER_SPACE_BETWEEN); // Magical number to fit everything with correct widths and margins

const getKey = (item: ShelfItem) => {
  return `${item.identifier}-${item.category}`;
};

const maybeCorrectSlide = (swiperRef, uiState, dragging) => {
  runInAction(() => {
    if (
      !dragging &&
      uiState.selectedItemIndex !== swiperRef.current?.activeIndex
    ) {
      swiperRef.current?.slideTo(uiState.selectedItemIndex);
    }
  });
};

const ShelfSwiper = () => {
  const uiState = useStore().shelfStore.shelfController.swiperUiState;

  const { setDragging, swiperRef } = useSwiperDial(uiState);

  const [localDragging, setLocalDragging] = useState(false);

  return (
    <Swiper
      allowTouchMove
      className={styles.container}
      data-testid="shelf-swiper"
      slidesPerView={SWIPER_SLIDES_PER_VIEW}
      onSwiper={(swiper) => (swiperRef.current = swiper)}
      slidesOffsetBefore={SWIPER_OFFSET_BEFORE}
      slidesOffsetAfter={SWIPER_OFFSET_AFTER}
      spaceBetween={SWIPER_SPACE_BETWEEN}
      speed={transitionDurationMs}
      width={SWIPER_WIDTH} // required in tests when virtual
      virtual={{
        addSlidesBefore: 3,
        addSlidesAfter: 1,
      }}
      onTouchStart={() => {
        setDragging(true);
        setLocalDragging(true);
      }}
      onTouchEnd={() => {
        setDragging(false);
        setLocalDragging(false);
        maybeCorrectSlide(swiperRef, uiState, localDragging);
      }}
      onTransitionEnd={() => {
        maybeCorrectSlide(swiperRef, uiState, localDragging);
      }}
      onTransitionStart={() => {
        maybeCorrectSlide(swiperRef, uiState, localDragging);
      }}
      onSlideResetTransitionStart={() => {
        uiState.dismissBanner();
        maybeCorrectSlide(swiperRef, uiState, localDragging);
      }}
      onActiveIndexChange={action((swiper) => {
        if (swiper.activeIndex !== uiState.selectedItemIndex) {
          uiState.handleDraggedToIndex(swiper.activeIndex);
        }
      })}
      touchStartPreventDefault={false}
    >
      {uiState.allShelfItems.map((item: ShelfItem, index: number) => {
        return (
          <SwiperSlide
            key={getKey(item)}
            virtualIndex={index}
            onClick={() => uiState.dismissBanner()}
          >
            {({ isActive }) => <ShelfSwiperItem {...{ isActive, item }} />}
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};

export default observer(ShelfSwiper);

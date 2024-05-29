import classNames from 'classnames';
import { useStore } from 'context/store';
import { useSwiperDial } from 'hooks/useSwiperDial';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Virtual, Swiper as SwiperCore } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './Tracklist.module.scss';
import TracklistItem from './TracklistItem';

SwiperCore.use([Virtual]);

const SCREEN_SIZE = 480;
const ITEM_HEIGHT = 128;
const CENTER_DIFF = 68;
const HEADER_HEIGHT = 160;
const SWIPER_HEIGHT = SCREEN_SIZE + CENTER_DIFF;
const SLIDES_PER_VIEW = SWIPER_HEIGHT / ITEM_HEIGHT;

const TracklistSwiper = () => {
  const uiState = useStore().tracklistStore.tracklistUiState;

  const { setDragging, swiperRef } = useSwiperDial(uiState);

  const getSlideOffsetAfter = (): number => {
    if (uiState.tracksList.length === 1) {
      return SWIPER_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT * 3;
    } else if (uiState.tracksList.length === 2) {
      return SWIPER_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT * 2;
    } else if (uiState.tracksList.length === 3) {
      return SWIPER_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT;
    }
    return SWIPER_HEIGHT - ITEM_HEIGHT + 2; // 2px for swiperRef end not to break
  };

  return (
    <Swiper
      allowTouchMove
      touchStartPreventDefault={false}
      className={styles.container}
      data-testid="tracklist-swiper"
      direction="vertical"
      slidesPerView={SLIDES_PER_VIEW}
      onSwiper={(swiperObj) => (swiperRef.current = swiperObj)}
      height={SWIPER_HEIGHT}
      width={800}
      slidesOffsetAfter={getSlideOffsetAfter()}
      virtual={{
        addSlidesBefore: 1,
        addSlidesAfter: 1,
      }}
      onTouchStart={() => setDragging(true)}
      onTouchEnd={() => setDragging(false)}
      onActiveIndexChange={action((swiper) => {
        if (swiper.activeIndex !== uiState.selectedItemIndex) {
          uiState.handleDraggedToIndex(swiper.activeIndex);
        }
      })}
    >
      {uiState.tracksList.map((item, index) => {
        return (
          <SwiperSlide
            virtualIndex={index}
            key={`${item.uri}:${index}`}
            className={classNames({
              [styles.trackSlideScrolled]: !uiState.isSelectingFirst,
            })}
            data-testid="tracklist-slide"
          >
            {({ isActive }) => (
              <TracklistItem item={item} isActive={isActive} />
            )}
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};

export default observer(TracklistSwiper);

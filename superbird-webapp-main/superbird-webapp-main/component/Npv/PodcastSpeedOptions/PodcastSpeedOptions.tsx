import { observer } from 'mobx-react-lite';
import Overlay, { FROM } from 'component/Overlays/Overlay';
import { useStore } from 'context/store';
import styles from 'component/Npv/PodcastSpeedOptions/PodcastSpeedOptions.module.scss';
import Type from 'component/CarthingUIComponents/Type/Type';
import { Swiper, SwiperSlide } from 'swiper/react';
import classNames from 'classnames';
import { transitionDurationMs } from 'style/Variables';
import { action } from 'mobx';
import { Swiper as SwiperCore, Virtual } from 'swiper';

import PodcastSpeedItem from 'component/Npv/PodcastSpeedOptions/PodcastSpeedItem';
import { useSwiperDial } from 'hooks/useSwiperDial';

SwiperCore.use([Virtual]);

const DEVICE_HEIGHT = 480;
const HEADER_HEIGHT = 160;
const ITEM_HEIGHT = 112;
const SWIPER_HEIGHT = DEVICE_HEIGHT - HEADER_HEIGHT;
const SLIDES_PER_VIEW = SWIPER_HEIGHT / ITEM_HEIGHT;
const OFFSET_AFTER = DEVICE_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT;

const PodcastSpeedOptions = () => {
  const uiState = useStore().npvStore.podcastSpeedUiState;

  const { setDragging, swiperRef } = useSwiperDial(uiState);

  return (
    <Overlay
      appear={FROM.BOTTOM}
      show={uiState.currentOverlayIsPodcastSpeed}
      classname={styles.podcastSpeedOverlay}
    >
      <div
        data-testid="podcastSpeedOptions"
        className={classNames(styles.podcastSpeedOptions, {
          [styles.smallHeader]: uiState.smallHeader,
        })}
      >
        <div
          className={classNames(styles.header, {
            [styles.smallHeader]: uiState.smallHeader,
          })}
        >
          <Type
            name="altoBold"
            textColor="white"
            className={classNames(styles.title, {
              [styles.smallTitle]: uiState.smallHeader,
            })}
          >
            Change podcast speed
          </Type>
        </div>
        <Swiper
          allowTouchMove
          touchStartPreventDefault={false}
          direction="vertical"
          slidesPerView={SLIDES_PER_VIEW}
          height={SWIPER_HEIGHT}
          width={800}
          initialSlide={uiState.currentPlayingPodcastIndex}
          onSwiper={(swiperObj) => (swiperRef.current = swiperObj)}
          speed={transitionDurationMs}
          virtual={{
            addSlidesBefore: 1,
            addSlidesAfter: 1,
          }}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          onSlideChange={action((swiperInstance) => {
            uiState.handleDraggedToIndex(swiperInstance.activeIndex);
            if (swiperInstance.activeIndex !== uiState.selectedItemIndex) {
              swiperInstance.slideTo(
                uiState.selectedItemIndex,
                transitionDurationMs,
              );
            }
          })}
          slidesOffsetAfter={OFFSET_AFTER}
        >
          {uiState.speedOptions.map((item, index) => (
            <SwiperSlide key={item} virtualIndex={index}>
              {({ isActive }) => (
                <PodcastSpeedItem speed={item} isActive={isActive} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </Overlay>
  );
};

export default observer(PodcastSpeedOptions);

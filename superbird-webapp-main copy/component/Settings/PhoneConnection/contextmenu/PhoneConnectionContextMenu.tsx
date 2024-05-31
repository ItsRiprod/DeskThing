import { useStore } from 'context/store';
import { useEffect } from 'react';
import styles from 'component/Settings/PhoneConnection/contextmenu/PhoneConnectionContextMenu.module.scss';
import { observer } from 'mobx-react-lite';
import { Swiper, SwiperSlide } from 'swiper/react';
import classNames from 'classnames';
import { useSwiperDial } from 'hooks/useSwiperDial';

import Type from 'component/CarthingUIComponents/Type/Type';
import { action } from 'mobx';
import { transitionDurationMs } from 'style/Variables';
import PhoneConnectionContextMenuItem from 'component/Settings/PhoneConnection/contextmenu/PhoneConnectionContextMenuItem';

const DEVICE_HEIGHT = 480;
const HEADER_HEIGHT = 144;
const ITEM_HEIGHT = 128;
const SWIPER_HEIGHT = DEVICE_HEIGHT - HEADER_HEIGHT;
const SLIDES_PER_VIEW = SWIPER_HEIGHT / ITEM_HEIGHT;

const PhoneConnectionContextMenu = () => {
  const uiState =
    useStore().phoneConnectionStore.phoneConnectionContextMenuUiState;
  const { setDragging, swiperRef } = useSwiperDial(uiState);

  useEffect(() => {
    uiState.settingsUbiLogger.logActionMenuImpression();
    uiState.setNewMenuIndex(0);
  }, [uiState]);

  const getSlideOffsetAfter = (): number => {
    if (uiState.menuItems.length < 2) {
      return SWIPER_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT * 2;
    }
    return SWIPER_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT / 2 + 2; // 2px for swiperRef end not to break
  };

  return (
    <div className={styles.dialog}>
      <div className={styles.phoneConnectionContextMenu}>
        <div className={styles.header}>
          <div className={styles.headerDetails}>
            <Type name="altoBold" textColor="white">
              {uiState.phoneName}
            </Type>
            <Type
              name="mestroBook"
              className={classNames(styles.subtitle, {
                [styles.connected]: uiState.isConnected,
              })}
            >
              {uiState.displayConnectionStatus}
            </Type>
          </div>
        </div>
        <Swiper
          allowTouchMove
          setWrapperSize
          touchStartPreventDefault={false}
          direction="vertical"
          slidesPerView={SLIDES_PER_VIEW}
          height={SWIPER_HEIGHT}
          width={800}
          initialSlide={0}
          onSwiper={(swiperObj) => (swiperRef.current = swiperObj)}
          speed={transitionDurationMs}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          onSlideChange={action((swiperInstance) => {
            uiState.setNewMenuIndex(swiperInstance.activeIndex);
            if (swiperInstance.activeIndex !== uiState.selectedItemIndex) {
              swiperInstance.slideTo(
                uiState.selectedItemIndex,
                transitionDurationMs,
              );
            }
          })}
          slidesOffsetAfter={getSlideOffsetAfter()}
          data-testid="phone-connection-context-menu"
        >
          {uiState.menuItems.map((item, index) => {
            return (
              <SwiperSlide key={item}>
                <PhoneConnectionContextMenuItem
                  item={item}
                  isActive={uiState.isActive(index)}
                  dialPressed={uiState.isDialPressed}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
};

export default observer(PhoneConnectionContextMenu);

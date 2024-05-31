import { useStore } from 'context/store';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { MainMenuItemId } from 'store/SettingsStore';
import { easingFunction, transitionDurationMs } from 'style/Variables';
import { Swiper } from 'swiper';
import { Swiper as SwiperComponent, SwiperSlide } from 'swiper/react';
import styles from './MainMenu.module.scss';
import MainMenuItem from './MainMenuItem';

const DEVICE_HEIGHT = 480;
const ITEM_HEIGHT = 128;
const HEADER_HEIGHT = 144;
const SWIPER_HEIGHT = DEVICE_HEIGHT - HEADER_HEIGHT;
const SLIDES_PER_VIEW = SWIPER_HEIGHT / ITEM_HEIGHT;
const OFFSET_AFTER = DEVICE_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT;

const MainMenu = () => {
  const {
    settingsStore,
    ubiLogger: { settingsUbiLogger },
  } = useStore();
  const [swiper, setSwiper] = useState<Swiper>();

  useEffect(
    () => settingsUbiLogger.logMainMenuImpression(),
    [settingsUbiLogger],
  );

  useEffect(() => {
    const effect = () => {
      if (
        swiper &&
        settingsStore.currentView.id === MainMenuItemId.SETTINGS_ROOT
      ) {
        swiper.slideTo(settingsStore.currentView.index, transitionDurationMs);
        swiper.wrapperEl.style.transitionTimingFunction = easingFunction;
      }
    };
    runInAction(effect);
  }, [settingsStore.currentView.index, settingsStore.currentView.id, swiper]);

  return (
    <div className={styles.mainMenu}>
      <div className={styles.header}>
        <p>Settings</p>
      </div>
      <SwiperComponent
        allowTouchMove
        touchStartPreventDefault={false}
        direction="vertical"
        slidesPerView={SLIDES_PER_VIEW}
        onSwiper={setSwiper}
        height={SWIPER_HEIGHT}
        width={800}
        initialSlide={settingsStore.currentView.index}
        onActiveIndexChange={(swiperInstance) =>
          settingsStore.handleSettingSetNewIndex(swiperInstance.activeIndex)
        }
        slidesOffsetAfter={OFFSET_AFTER}
        setWrapperSize
      >
        {settingsStore.rows?.map((item, index) => (
          <SwiperSlide key={item.id}>
            <MainMenuItem
              item={item}
              active={settingsStore.currentView.index === index}
            />
          </SwiperSlide>
        ))}
      </SwiperComponent>
    </div>
  );
};

export default observer(MainMenu);

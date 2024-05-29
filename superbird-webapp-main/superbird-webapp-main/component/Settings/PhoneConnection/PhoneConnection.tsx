import { useStore } from 'context/store';
import { useEffect, useState } from 'react';
import styles from './PhoneConnection.module.scss';
import { observer } from 'mobx-react-lite';
import SubmenuHeader from '../Submenu/SubmenuHeader';
import { Swiper } from 'swiper';
import { Swiper as SwiperComponent, SwiperSlide } from 'swiper/react';
import { easingFunction } from 'style/Variables';
import classNames from 'classnames';

import pointerListenersMaker from 'helpers/PointerListeners';
import PhoneConnectionItem from './PhoneConnectionItem';
import PhoneConnectionModal from './PhoneConnectionModal';
import { IconMobile64 } from 'component/CarthingUIComponents';
import { runInAction } from 'mobx';
import Overlay, { FROM } from 'component/Overlays/Overlay';
import PhoneConnectionContextMenu from 'component/Settings/PhoneConnection/contextmenu/PhoneConnectionContextMenu';
import { MainMenuItemId } from 'store/SettingsStore';

const DEVICE_HEIGHT = 480;
const HEADER_HEIGHT = 144;
const ITEM_HEIGHT = 128;
const SWIPER_HEIGHT = DEVICE_HEIGHT - HEADER_HEIGHT;
const SLIDES_PER_VIEW = SWIPER_HEIGHT / ITEM_HEIGHT;

const PhoneConnection = () => {
  const {
    settingsStore,
    bluetoothStore,
    remoteControlStore,
    hardwareStore,
    phoneConnectionStore,
    ubiLogger,
  } = useStore();

  const [swiper, setSwiper] = useState<Swiper>();
  const [pressedAddMoreItem, setPressedAddMoreItem] = useState(false);

  const getSlideOffsetAfter = (): number => {
    // No devices visible only add new phone:
    if (bluetoothStore.bluetoothDeviceList.length === 0) {
      return SWIPER_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT * 3;
    } else if (bluetoothStore.bluetoothDeviceList.length === 1) {
      return SWIPER_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT / 2;
    }
    return DEVICE_HEIGHT - HEADER_HEIGHT - ITEM_HEIGHT;
  };

  useEffect(() => {
    ubiLogger.settingsUbiLogger.logPhoneConnectionViewImpression();
    ubiLogger.sendLogBatch();
  }, [ubiLogger]);

  useEffect(() => {
    const effect = () => {
      if (swiper && settingsStore.currentIsPhoneConnection) {
        swiper.slideTo(settingsStore.currentView.index);
        swiper.wrapperEl.style.transitionTimingFunction = easingFunction;
      }
    };
    runInAction(effect);
  }, [
    settingsStore.currentIsPhoneConnection,
    settingsStore.currentView.index,
    swiper,
  ]);

  useEffect(() => {
    bluetoothStore.triggerBTDeviceList();
    return phoneConnectionStore.unmountPhoneConnectionView;
  }, [bluetoothStore, phoneConnectionStore.unmountPhoneConnectionView]);

  const icon = <IconMobile64 />;
  const addPhoneItemIsActive =
    settingsStore.currentView.index ===
    bluetoothStore.bluetoothDeviceList.length;

  return (
    <div className={classNames(styles.phoneConnection)}>
      <SubmenuHeader
        name={settingsStore.phoneConnectionView.label}
        icon={icon}
      />
      <SwiperComponent
        setWrapperSize
        direction="vertical"
        slidesPerView={SLIDES_PER_VIEW}
        onSwiper={setSwiper}
        height={SWIPER_HEIGHT}
        width={800}
        initialSlide={0}
        slidesOffsetAfter={getSlideOffsetAfter()}
        onActiveIndexChange={(swiperInstance) =>
          settingsStore.handleSettingSetNewIndex(swiperInstance.activeIndex)
        }
        data-testid={`${MainMenuItemId.PHONE_CONNECTION}-submenu`}
      >
        {bluetoothStore.bluetoothDeviceList?.map((phone, index) => {
          const isCurrentDevice =
            phone.address === bluetoothStore.currentDevice?.address;
          const isConnected = remoteControlStore.isConnectedPhone(
            phone.address,
          );
          const isConnecting = isCurrentDevice && !isConnected;
          const isActive = settingsStore.currentView.index === index;

          return (
            <SwiperSlide key={phone.address}>
              <PhoneConnectionItem
                phoneName={phone.device_info?.name ?? ''}
                phoneAddress={phone.address}
                isActive={isActive}
                isConnected={isConnected}
                isConnecting={isConnecting}
              />
            </SwiperSlide>
          );
        })}
        <SwiperSlide
          className={classNames(
            styles.phoneConnectionItem,
            styles.addMorePhone,
            {
              [styles.active]: addPhoneItemIsActive,
              [styles.pressed]:
                pressedAddMoreItem ||
                (addPhoneItemIsActive && hardwareStore.dialPressed),
            },
          )}
          {...pointerListenersMaker(setPressedAddMoreItem)}
          onClick={phoneConnectionStore.handleAddNewPhoneClick}
        >
          <div className={styles.title}>Add a new phone</div>
        </SwiperSlide>
      </SwiperComponent>
      <Overlay
        show={
          phoneConnectionStore.phoneConnectionContextMenuUiState
            .phoneMenuShowing
        }
        appear={FROM.BOTTOM}
      >
        <PhoneConnectionContextMenu />
      </Overlay>
      <PhoneConnectionModal />
    </div>
  );
};

export default observer(PhoneConnection);

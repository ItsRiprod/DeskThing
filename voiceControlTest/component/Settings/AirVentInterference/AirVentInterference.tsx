import { useEffect, useRef, useState } from 'react';
import styles from './AirVentInterference.module.scss';
import { observer } from 'mobx-react-lite';
import { OptionsMenuItemId } from 'store/SettingsStore';
import classNames from 'classnames';
import pointerListenersMaker from 'helpers/PointerListeners';
import { IconWind32, Type } from 'component/CarthingUIComponents';
import { useStore } from 'context/store';

const CONTENT_HEIGHT = 490;
const NUMBER_OF_SCROLL_STEPS = 3;
const SCROLL_STEP_SIZE = CONTENT_HEIGHT / NUMBER_OF_SCROLL_STEPS;

const AirVentInterference = () => {
  const [pressed, setPressed] = useState(false);
  const aviContainerRef = useRef<HTMLDivElement>(null);

  const uiState =
    useStore().airVentInterferenceController.airVentInterferenceUiState;

  useEffect(() => {
    const onTouchEnd = () => {
      const scrollElement = aviContainerRef.current;
      if (scrollElement) {
        uiState.setAirVentInterferenceScrollStep(
          (scrollElement.scrollTop / CONTENT_HEIGHT) * NUMBER_OF_SCROLL_STEPS,
        );
      }
    };

    const onScroll = () => {
      const scrollElement = aviContainerRef.current;
      if (scrollElement) {
        const hitToBottom =
          scrollElement.scrollTop ===
          scrollElement.scrollHeight - scrollElement.offsetHeight;
        if (hitToBottom) {
          uiState.setAirVentInterferenceScrollStep(
            (scrollElement.scrollTop / CONTENT_HEIGHT) * NUMBER_OF_SCROLL_STEPS,
          );
        }
      }
    };

    uiState.logImpression();
    const scrollElement = aviContainerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('touchend', onTouchEnd);
      scrollElement.addEventListener('scroll', onScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('touchend', onTouchEnd);
        scrollElement.removeEventListener('scroll', onScroll);
      }
      uiState.resetAirVentContainerScrollStep();
    };
  }, [uiState]);

  const scrollElement = aviContainerRef.current;

  if (uiState.airVentContainerScrollStep >= 0 && scrollElement) {
    const top = uiState.airVentContainerScrollStep * SCROLL_STEP_SIZE;

    scrollElement.scrollTo({
      top: top,
      behavior: 'smooth',
    });
  }

  return (
    <>
      <div className={styles.aviHeader}>
        <span data-testid={`${OptionsMenuItemId.AIR_VENT_INTERFERENCE}-header`}>
          <Type name="altoBold">Air vent interference</Type>
        </span>
      </div>
      <div ref={aviContainerRef} className={styles.aviContainer}>
        <div
          className={classNames(
            styles.notification,
            {
              [styles.pressed]: pressed || uiState.highlightOption,
            },
            {
              [styles.focused]: uiState.isNotificationStep,
            },
          )}
          {...pointerListenersMaker(setPressed)}
          onClick={() => uiState.toggleNotification()}
          data-testid="avi-notification"
        >
          <p>Allow air vent alerts</p>
          <span
            data-testid="avi-notification-status"
            className={classNames({
              [styles.onOff]: !uiState.airVentAlertsDisabled,
            })}
          >
            {uiState.airVentAlertsDisabled ? 'Off' : 'On'}
          </span>
        </div>
        <div className={styles.texts}>
          <p className={styles.intro}>
            Too much air flowing into your microphones will <br /> likely
            interfere with voice requests. When we detect an issue,{' '}
            <IconWind32 /> will appear at the top right corner of the screen. If
            this happens, here are some things to try:
          </p>
          <ul>
            <li>Move Car Thing above the level of air flow</li>
            <li>Direct the air flow below Car Thing</li>
            <li>Close the air vent</li>
            <li>Use a different mount</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default observer(AirVentInterference);

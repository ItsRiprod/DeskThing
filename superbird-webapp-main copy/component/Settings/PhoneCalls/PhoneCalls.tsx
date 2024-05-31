import { observer } from 'mobx-react-lite';
import SubmenuHeader from 'component/Settings/Submenu/SubmenuHeader';
import SubmenuItem from 'component/Settings/Submenu/SubmenuItem';
import { useEffect, useRef } from 'react';
import { useStore } from 'context/store';
import styles from './PhoneCalls.module.scss';
import Type from 'component/CarthingUIComponents/Type/Type';
import { NUMBER_OF_SCROLL_STEPS } from 'component/Settings/PhoneCalls/PhoneCallsUiState';

const CONTENT_HEIGHT = 300;
const SCROLL_STEP_SIZE = CONTENT_HEIGHT / NUMBER_OF_SCROLL_STEPS;

const PhoneCalls = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const uiState = useStore().settingsStore.phoneCallsUiState;

  useEffect(() => {
    const onTouchEnd = () => {
      const scrollElement = containerRef.current;
      if (scrollElement) {
        uiState.setPhoneCallsScrollStep(
          (scrollElement.scrollTop / CONTENT_HEIGHT) * NUMBER_OF_SCROLL_STEPS,
        );
      }
    };

    const onScroll = () => {
      const scrollElement = containerRef.current;
      if (scrollElement) {
        const hitToBottom =
          scrollElement.scrollTop ===
          scrollElement.scrollHeight - scrollElement.offsetHeight;
        if (hitToBottom) {
          uiState.setPhoneCallsScrollStep(
            (scrollElement.scrollTop / CONTENT_HEIGHT) * NUMBER_OF_SCROLL_STEPS,
          );
        }
      }
    };

    const scrollElement = containerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('touchend', onTouchEnd);
      scrollElement.addEventListener('scroll', onScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('touchend', onTouchEnd);
        scrollElement.removeEventListener('scroll', onScroll);
      }
      uiState.resetScrollStep();
    };
  }, [uiState, containerRef]);

  const scrollElement = containerRef.current;

  if (uiState.scrollStep >= 0 && scrollElement) {
    const top = uiState.scrollStep * SCROLL_STEP_SIZE;

    scrollElement.scrollTo({
      top: top,
      behavior: 'smooth',
    });
  }

  return (
    <>
      <SubmenuHeader icon={null} name="Phone calls" />
      <div ref={containerRef} className={styles.scrollContainer}>
        <div className={styles.submenuItemWrapper}>
          <SubmenuItem
            active={uiState.isNotificationStep}
            item={uiState.phoneCallsSubmenuItem}
          />
        </div>
        <div className={styles.text}>
          <Type name="celloBook">
            If turned on, you’ll see your incoming and outgoing phone call info
            on your screen and will be able to answer or decline calls. Be sure
            your phone is connected to the car's speakers and microphone.
            <br />
            <br />
            If your phone can’t be connected to the car’s microphone, place your
            phone close enough to use the phone’s microphone.
          </Type>
        </div>
      </div>
    </>
  );
};

export default observer(PhoneCalls);

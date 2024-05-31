import styles from './PhoneCall.module.scss';
import { observer } from 'mobx-react-lite';
import Type from 'component/CarthingUIComponents/Type/Type';
import { useStore } from 'context/store';
import { IconUserAltCircle } from '@spotify-internal/encore-web';
import AmbientBackdrop from 'component/AmbientBackdrop/AmbientBackdrop';
import { useEffect } from 'react';
import PhoneCallTimer from 'component/PhoneCall/PhoneCallTimer';
import DeclineButton from 'component/PhoneCall/DeclineButton';
import AnswerButton from 'component/PhoneCall/AnswerButton';

const getBackgroundColorFromChannels = (rgbChannels: number[]): string => {
  return `rgb(${rgbChannels.join(',')})`;
};
const PhoneCall = () => {
  const playerStore = useStore().playerStore;
  const uiState = useStore().phoneCallController.phoneCallUiState;

  useEffect(() => {
    uiState.handleMount();
    return () => {
      uiState.handleUnmount();
    };
  }, [uiState]);

  return (
    <>
      <AmbientBackdrop
        imageId={playerStore.currentImageId}
        getBackgroundStyleAttribute={getBackgroundColorFromChannels}
      />
      <div className={styles.phoneCall}>
        <div className={styles.infoWrapper}>
          {uiState.phoneCallImage ? (
            <img
              src={`data:image/jpeg;base64,${uiState.phoneCallImage}`}
              alt=""
            />
          ) : (
            <IconUserAltCircle iconSize={64} />
          )}

          <Type name="brioBold" className={styles.title}>
            {uiState.title}
          </Type>
          {uiState.subtitle && (
            <Type name="celloBook" className={styles.subtitle}>
              {uiState.subtitle}
            </Type>
          )}
          {uiState.shouldShowCallingText ? (
            <Type name="celloBook">Calling...</Type>
          ) : (
            <PhoneCallTimer />
          )}
        </div>

        <div className={styles.actions}>
          <AnswerButton />
          {!uiState.isOutgoing && <DeclineButton />}
        </div>
      </div>
    </>
  );
};

export default observer(PhoneCall);

import { useEffect } from 'react';
import styles from './Listening.module.scss';
import { observer } from 'mobx-react-lite';
import VoiceConfirmation from 'component/VoiceConfirmation/VoiceConfirmation';
import Jellyfish from '../CarthingUIComponents/Jellyfish/Jellyfish';
import { useStore } from 'context/store';
import Type from 'component/CarthingUIComponents/Type/Type';
import { VoiceConfirmationIntent } from '../VoiceConfirmation/VoiceConfirmationIntents';
import classnames from 'classnames';
import { firstLetterUpperCase } from '../../helpers/TextUtil';
import { VoiceConfirmationAction } from '../VoiceConfirmation/VoiceConfirmationActions';
import AutoSizingText from 'component/AutoSizingText/AutoSizingText';

export interface ListeningProps {
  maybeTryAgain: () => void;
  errorUiTitle?: string;
  errorUiSubtitle?: string;
  error?: unknown;
  friendlyError?: string;
  confirmationText?: {
    title: string;
    subtitle: string;
  };
  showingVoiceConfirmation: boolean;
  intent: VoiceConfirmationIntent;
  action?: VoiceConfirmationAction;
  transcript: string;
  isFinal: boolean;
  isError: boolean;
  listening: boolean;
}

const INTENT_TO_CONFIRMATION_TEXT: Record<VoiceConfirmationIntent, string> = {
  ADD_TO_COLLECTION: 'Saved',
  THUMBS_UP: 'Saved',
  SHUFFLE_ON: 'Shuffle on',
  SHUFFLE_OFF: 'Shuffle off',
  REPEAT_ON: 'Repeat on',
  REPEAT_ONE: 'Repeat one on',
  REPEAT_OFF: 'Repeat off',
  SET_PLAYBACK_SPEED_1POINT5X: 'Playback speed set',
  SET_PLAYBACK_SPEED_1POINT2X: 'Playback speed set',
  SET_PLAYBACK_SPEED_1X: 'Playback speed set',
  MUTE_MIC: 'Microphone off',
};

const ACTION_TO_CONFIRMATION_TEXT: Record<VoiceConfirmationAction, string> = {
  SAVE_TO_COLLECTION_PODCAST: 'Added',
};

export function Listening({
  maybeTryAgain,
  errorUiTitle,
  errorUiSubtitle,
  error,
  confirmationText,
  friendlyError,
  showingVoiceConfirmation,
  intent,
  action,
  transcript,
  isFinal,
  isError,
  listening,
}: ListeningProps) {
  let content: JSX.Element | null = null;
  let showJellyfish = true;

  if (errorUiTitle) {
    content = (
      <Type name="brioBold" className={styles.fadeIn}>
        <div data-testid="error-ui-title">{errorUiTitle}</div>
        <div data-testid="error-ui-subtitle">{errorUiSubtitle}</div>
      </Type>
    );
  } else if (error || friendlyError) {
    content = (
      <Type
        name="brioBold"
        className={styles.fadeIn}
        dataTestId="voice-error-text"
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {friendlyError || (
          // TODO: It's not clear in which case this can happen,
          //  VoiceStore should provide a default
          <>
            <div>Sorry!</div>
            <div>Something went wrong.</div>
            <div>Tap to try again.</div>
          </>
        )}
      </Type>
    );
  } else if (confirmationText) {
    content = (
      <Type
        name="brioBold"
        className={classnames(styles.textConfirmation, styles.fadeIn)}
      >
        {confirmationText.title}
        <br />
        {confirmationText.subtitle}
      </Type>
    );
  } else if (showingVoiceConfirmation) {
    showJellyfish = false;
    content = (
      <div className={classnames(styles.voiceConfirmation, styles.centered)}>
        <VoiceConfirmation intent={intent} action={action} />
        <Type
          name="altoBold"
          textColor="white"
          className={styles.voiceConfirmationText}
        >
          {(action && ACTION_TO_CONFIRMATION_TEXT[action]) ||
            INTENT_TO_CONFIRMATION_TEXT[intent] ||
            ''}
        </Type>
      </div>
    );
  } else if (transcript && isFinal && !isError) {
    content = (
      <AutoSizingText
        textContent={firstLetterUpperCase(transcript)}
        className={styles.fadeIn}
        maxHeight={3 * 72}
        textSizesDescending={['forteBold', 'brioBold']}
        dataTestId="voice-transcript"
      />
    );
  }

  return (
    <div
      className={classnames(styles.listeningWrapper, {
        [styles.currentlyListening]: listening,
      })}
      data-testid="voice-animation"
      onClick={maybeTryAgain}
    >
      {content}
      {showJellyfish && (
        <div className={styles.jellyfish}>
          <Jellyfish />
        </div>
      )}
    </div>
  );
}

const ListeningContainer = () => {
  const { voiceStore, ubiLogger } = useStore();

  useEffect(() => {
    ubiLogger.voiceUbiLogger.logVoiceImpression();
  }, [ubiLogger.voiceUbiLogger]);

  useEffect(() => {
    if (voiceStore.isError) {
      ubiLogger.voiceUbiLogger.logErrorImpression(
        voiceStore.error || voiceStore.friendlyError,
      );
    }
  }, [
    voiceStore.isError,
    ubiLogger.voiceUbiLogger,
    voiceStore.error,
    voiceStore.friendlyError,
  ]);

  const maybeTryAgain = () => {
    if (voiceStore.error) {
      ubiLogger.voiceUbiLogger.logErrorTryAgain(voiceStore.error);
      voiceStore.retry();
    }
  };

  const {
    showingVoiceConfirmation,
    intent,
    errorUiTitle,
    errorUiSubtitle,
    error,
    friendlyError,
    isError,
    listening,
  } = voiceStore;
  const { confirmationText } = voiceStore.state;
  const { action } = voiceStore.state.nlu.custom;
  const { transcript, isFinal } = voiceStore.state.asr;

  return (
    <Listening
      maybeTryAgain={maybeTryAgain}
      errorUiTitle={errorUiTitle}
      errorUiSubtitle={errorUiSubtitle}
      error={error}
      confirmationText={confirmationText}
      friendlyError={friendlyError}
      showingVoiceConfirmation={showingVoiceConfirmation}
      intent={intent}
      action={action}
      transcript={transcript}
      isFinal={isFinal}
      isError={isError}
      listening={listening}
    />
  );
};

export default observer(ListeningContainer);

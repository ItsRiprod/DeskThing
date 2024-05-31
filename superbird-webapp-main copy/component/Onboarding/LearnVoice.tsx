import { useStore } from 'context/store';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { LearnVoiceStepId } from 'store/OnboardingStore';
import LearnVoiceStep from './LearnVoiceStep';
import styles from './Onboarding.module.scss';

type LearnVoiceTts = {
  fileName?: string;
  timeout: number;
};

export type LearnVoiceData = {
  header: string;
  title: string;
  voiceEnabled: boolean;
  tts1: LearnVoiceTts;
  tts2?: LearnVoiceTts;
};

const animations = {
  exit: styles.animationExit,
  exitActive: styles.animationExitActive,
  exitDone: styles.animationExitDone,
};

export const learnVoiceData: Record<LearnVoiceStepId, LearnVoiceData> = {
  [LearnVoiceStepId.FIRST_UP]: {
    header: 'First up:',
    title: 'Using your voice',
    voiceEnabled: false,
    tts1: {
      fileName: 'onboarding_learn_voice_1_1.mp3',
      timeout: 5000,
    },
  },
  [LearnVoiceStepId.VOICE_PLAY_DRIVING_MUSIC]: {
    header: 'Try saying...',
    title: 'Hey Spotify, play some driving music',
    voiceEnabled: true,
    tts1: {
      fileName: 'onboarding_learn_voice_2_1.mp3',
      timeout: 3600,
    },
    tts2: {
      // no fileName since we will only play the tts coming from backend
      timeout: 6000,
    },
  },
  [LearnVoiceStepId.VOICE_NEXT_SONG]: {
    header: 'Try saying...',
    title: 'Hey Spotify, next song',
    voiceEnabled: true,
    tts1: {
      fileName: 'onboarding_learn_voice_3_1.mp3',
      timeout: 6000,
    },
    tts2: {
      fileName: 'onboarding_learn_voice_3_2.mp3',
      timeout: 5000,
    },
  },
  [LearnVoiceStepId.LAST_STEP]: {
    header: 'Last step:',
    title: 'Navigating around Car Thing',
    voiceEnabled: false,
    tts1: {
      fileName: 'onboarding_learn_tactile_navigation.mp3',
      timeout: 8000,
    },
  },
};

const LearnVoice = () => {
  const {
    onboardingStore: { learnVoiceStep },
    ubiLogger,
    voiceStore,
  } = useStore();

  useEffect(() => {
    switch (learnVoiceStep) {
      case LearnVoiceStepId.FIRST_UP:
        ubiLogger.onboardingUbiLogger.logFirstUpShown();
        break;
      case LearnVoiceStepId.VOICE_PLAY_DRIVING_MUSIC:
        ubiLogger.onboardingUbiLogger.logTryPlayPlaylistShown();
        break;
      case LearnVoiceStepId.VOICE_NEXT_SONG:
        ubiLogger.onboardingUbiLogger.logTrySkipNextShown();
        break;
      case LearnVoiceStepId.LAST_STEP:
        ubiLogger.onboardingUbiLogger.logLastStepShown();
        break;
      default:
        break;
    }
  }, [learnVoiceStep, ubiLogger.onboardingUbiLogger]);

  useEffect(() => {
    const effect = () => {
      if (voiceStore.error) {
        ubiLogger.onboardingUbiLogger.logErrorShown(
          LearnVoiceStepId[learnVoiceStep],
          voiceStore.error,
        );
      }
    };
    runInAction(effect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceStore.error]);

  return (
    <SwitchTransition>
      <CSSTransition
        key={learnVoiceStep}
        timeout={1300}
        classNames={{ ...animations }}
      >
        <LearnVoiceStep learnVoiceData={learnVoiceData[learnVoiceStep]} />
      </CSSTransition>
    </SwitchTransition>
  );
};

export default observer(LearnVoice);

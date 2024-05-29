import { useStore } from 'context/store';
import { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { LearnVoiceStepId } from 'store/OnboardingStore';
import classNames from 'classnames';
import styles from './SkipButton.module.scss';
import { observer } from 'mobx-react-lite';
import { Type } from 'component/CarthingUIComponents';

const animations = {
  appear: styles.animationEnter,
  appearActive: styles.animationEnterActive,
  appearDone: styles.animationEnterDone,
};
const END_TOUR_VIA_SKIP_TTS = 'onboarding_learn_tactile_end_tour_via_skip.mp3';

const SkipButton = () => {
  const { onboardingStore, voiceStore, ubiLogger } = useStore();
  const [pressedSkip, setPressedSkip] = useState(false);

  const logSkipClicked = () => {
    if (voiceStore.error) {
      ubiLogger.onboardingUbiLogger.logErrorSkipClicked(
        LearnVoiceStepId[onboardingStore.learnVoiceStep],
        voiceStore.error,
      );
      return;
    }

    switch (onboardingStore.learnVoiceStep) {
      case LearnVoiceStepId.FIRST_UP:
        ubiLogger.onboardingUbiLogger.logFirstUpSkipClicked();
        break;
      case LearnVoiceStepId.VOICE_NEXT_SONG:
        ubiLogger.onboardingUbiLogger.logNextSongSkipClicked();
        break;
      case LearnVoiceStepId.VOICE_PLAY_DRIVING_MUSIC:
        ubiLogger.onboardingUbiLogger.logPlayPlaylistSkipClicked();
        break;
      case LearnVoiceStepId.LAST_STEP:
        ubiLogger.onboardingUbiLogger.logLastStepSkipClicked();
        break;
      default:
        break;
    }
  };

  const skip = () => {
    logSkipClicked();
    if (onboardingStore.learnVoiceStep === LearnVoiceStepId.LAST_STEP) {
      onboardingStore.playTts(END_TOUR_VIA_SKIP_TTS);
      onboardingStore.setOnboardingFinished();
    } else {
      onboardingStore.setLearnVoiceStep(LearnVoiceStepId.LAST_STEP);
    }
  };

  return (
    <CSSTransition appear in timeout={2500} classNames={{ ...animations }}>
      <div
        className={classNames(styles.skipButtonWrapper, {
          [styles.pressed]: pressedSkip,
        })}
        onClick={() => skip()}
        onPointerDown={() => setPressedSkip(true)}
        onPointerUp={() => setPressedSkip(false)}
        onPointerCancel={() => setPressedSkip(false)}
      >
        <Type name="celloBook">{voiceStore.error ? 'Next' : 'Skip'}</Type>
      </div>
    </CSSTransition>
  );
};

export default observer(SkipButton);

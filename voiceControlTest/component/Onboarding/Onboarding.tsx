import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { OnboardingStepId } from 'store/OnboardingStore';
import LearnVoice from './LearnVoice';
import Start from './Start';
import LearnTactile from './LearnTactile';
import { runInAction } from 'mobx';

const onboardingStepToComp = {
  [OnboardingStepId.START]: <Start />,
  [OnboardingStepId.LEARN_VOICE]: <LearnVoice />,
  [OnboardingStepId.LEARN_TACTILE]: <LearnTactile />,
};

const Onboarding = () => {
  const { onboardingStore, sessionStateStore, permissionsStore } = useStore();

  const timeoutId = useRef<number>();
  useEffect(() => {
    const effect = () => {
      if (!sessionStateStore.phoneHasNetwork) {
        timeoutId.current = window.setTimeout(() => {
          onboardingStore.setOnboardingFinished();
        }, 10_000);
      } else if (sessionStateStore.phoneHasNetwork && timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
    };
    runInAction(effect);
  }, [onboardingStore, sessionStateStore.phoneHasNetwork]);

  useEffect(() => {
    const effect = () => {
      if (permissionsStore.canUseCarThing === false) {
        onboardingStore.setOnboardingFinished();
      }
    };
    runInAction(effect);
  }, [onboardingStore, permissionsStore.canUseCarThing]);

  useEffect(() => {
    onboardingStore.setOnboardingStarted(true);
  }, [onboardingStore]);

  if (!sessionStateStore.phoneHasNetwork) {
    return null;
  }

  return onboardingStepToComp[onboardingStore.onboardingStep];
};

export default observer(Onboarding);

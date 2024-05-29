import { useEffect } from 'react';
import styles from './NoInteractionModal.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';
import {
  NoInteractionModalOption,
  OnboardingStepId,
} from 'store/OnboardingStore';
import {
  Button,
  ButtonGroup,
  ButtonType,
} from 'component/CarthingUIComponents/';

const NoInteractionModal = () => {
  const { onboardingStore, ubiLogger, viewStore } = useStore();

  useEffect(() => {
    ubiLogger.onboardingUbiLogger.logNoInteractionModalShown(
      OnboardingStepId[OnboardingStepId.LEARN_TACTILE],
    );
  }, [ubiLogger.onboardingUbiLogger]);

  const continueSelected =
    onboardingStore.noInteractionModal?.currentOption ===
    NoInteractionModalOption.CONTINUE;

  const continueOnboarding = () => {
    ubiLogger.onboardingUbiLogger.logNoInteractionContinueButtonClicked(
      OnboardingStepId[OnboardingStepId.LEARN_TACTILE],
    );
    onboardingStore.continueOnboarding();
  };
  const endDuringTactile = () => {
    ubiLogger.onboardingUbiLogger.logNoInteractionEndButtonClicked(
      OnboardingStepId[OnboardingStepId.LEARN_TACTILE],
      viewStore.currentView,
    );
    onboardingStore.endDuringTactile();
  };
  return (
    <div className={styles.noInteraction}>
      <ButtonGroup style={{ width: '335px' }}>
        <Button
          type={
            continueSelected
              ? ButtonType.BUTTON_PRIMARY
              : ButtonType.BUTTON_SECONDARY
          }
          onClick={continueOnboarding}
        >
          Continue Tour
        </Button>
        <Button
          type={
            continueSelected
              ? ButtonType.BUTTON_SECONDARY
              : ButtonType.BUTTON_PRIMARY
          }
          onClick={endDuringTactile}
        >
          End Tour
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default observer(NoInteractionModal);

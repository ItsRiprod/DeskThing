import InterappActions from 'middleware/InterappActions';
import MiddlewareActions from 'middleware/MiddlewareActions';
import { makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';
import Socket from '../Socket';
import {
  learnTactileTTS,
  LearnTactileTtsNames,
} from 'component/Onboarding/tts/Tactile';
import { AppView } from './ViewStore';

type SettingsMessage = {
  type: 'settings_response';
  payload: OnboardingPayload;
};

type OnboardingPayload = {
  key: 'onboarding_status';
  value?: 'finished';
  value_type: 'string';
  error?: boolean;
};

export enum OnboardingStepId {
  START,
  LEARN_VOICE,
  LEARN_TACTILE,
}

export enum LearnVoiceStepId {
  FIRST_UP,
  VOICE_PLAY_DRIVING_MUSIC,
  VOICE_NEXT_SONG,
  LAST_STEP,
}

export enum NoInteractionModalOption {
  CONTINUE,
  END,
}

type NoInteractionModal = {
  ttsToRepeat: Tts;
  currentOption: NoInteractionModalOption;
  tactileEnabledOnClose: {
    back: boolean;
    turn: boolean;
    press: boolean;
  };
};

const LEARN_VOICE_ORDER = [
  LearnVoiceStepId.FIRST_UP,
  LearnVoiceStepId.VOICE_PLAY_DRIVING_MUSIC,
  LearnVoiceStepId.VOICE_NEXT_SONG,
  LearnVoiceStepId.LAST_STEP,
];

export interface Tts {
  fileName: string;
  fileLength: number;
}

export const delayedAction = (actionToRun: Function, timeout: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      actionToRun();
      resolve();
    }, timeout);
  });
};

class OnboardingStore {
  rootStore: RootStore;
  interappActions: InterappActions;
  middlewareActions: MiddlewareActions;

  constructor(
    rootStore: RootStore,
    socket: Socket,
    interappActions: InterappActions,
    middlewareActions: MiddlewareActions,
  ) {
    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
      middlewareActions: false,
    });

    this.rootStore = rootStore;
    this.interappActions = interappActions;
    this.middlewareActions = middlewareActions;
    socket.addSocketEventListener((msg: SettingsMessage) =>
      this.onMiddlewareEvent(msg),
    );
  }

  onboardingMsgReceived: boolean = false;
  onboardingFinished: boolean = false;
  onboardingStarted: boolean = false;
  wakewordTriggered: boolean = false;
  onboardingStep = OnboardingStepId.START;
  learnVoiceStep = LEARN_VOICE_ORDER[0];

  dialPressEnabled: boolean = false;
  dialTurnEnabled: boolean = false;
  backEnabled: boolean = false;
  buttonsEnabled: boolean = false;
  dialTurnCounter: number = 0;
  dialPressCounter: number = 0;
  backCounter: number = 0;
  noInteractionModal?: NoInteractionModal;

  onMiddlewareEvent(msg: SettingsMessage) {
    if (
      msg.type === 'settings_response' &&
      msg.payload.key === 'onboarding_status'
    ) {
      this.onboardingMsgReceived = true;
      if (msg.payload.value) {
        this.onboardingFinished = msg.payload.value === 'finished';
      }
    }
  }

  get shouldShowOnboarding(): boolean {
    return (
      !this.onboardingFinished ||
      (this.onboardingFinished && this.onboardingStarted)
    );
  }

  setOnboardingStarted(started: boolean) {
    this.onboardingStarted = started;
  }

  setOnboaringView(onboardingStep: OnboardingStepId) {
    this.onboardingStep = onboardingStep;
  }

  setLearnVoiceStep(learnVoiceStep: LearnVoiceStepId) {
    this.learnVoiceStep = learnVoiceStep;
  }

  showNoInteractionModal(ttsToRepeat: Tts): void {
    this.noInteractionModal = {
      ttsToRepeat,
      tactileEnabledOnClose: {
        back: this.backEnabled,
        turn: this.dialTurnEnabled,
        press: this.dialPressEnabled,
      },
      currentOption: NoInteractionModalOption.CONTINUE,
    };
    this.setDialPressEnabled(false);
    this.setDialTurnEnabled(false);
    this.setBackEnabled(false);
  }

  hideNoInteractionModal() {
    if (this.noInteractionModal) {
      this.setBackEnabled(this.noInteractionModal.tactileEnabledOnClose.back);
      this.setDialPressEnabled(
        this.noInteractionModal.tactileEnabledOnClose.press,
      );
      this.setDialTurnEnabled(
        this.noInteractionModal.tactileEnabledOnClose.turn,
      );
      this.noInteractionModal = undefined;
    }
  }

  nextLearnVoiceStep() {
    if (this.learnVoiceStep === LEARN_VOICE_ORDER.length - 1) {
      this.setOnboaringView(OnboardingStepId.LEARN_TACTILE);
      this.rootStore.viewStore.backToContentShelf();
    } else {
      this.learnVoiceStep++;
    }
  }

  requestOnboardingStatus() {
    this.middlewareActions.onboardingGet();
  }

  endDuringTactile() {
    this.setOnboardingFinished();
    this.hideNoInteractionModal();
    this.waitForTts(learnTactileTTS[LearnTactileTtsNames.SKIP_TOUR]);
  }

  continueOnboarding() {
    if (this.noInteractionModal) {
      this.waitForTts(this.noInteractionModal.ttsToRepeat);
    }
    this.hideNoInteractionModal();
  }

  setOnboardingFinished() {
    this.muteMic(false);
    this.onboardingFinished = true;
    this.setOnboardingStarted(false);
    this.callMWtoFinishOnboarding();
  }

  callMWtoFinishOnboarding() {
    this.middlewareActions.onboardingFinished();
  }

  setWakewordTriggered(wakewordTriggered: boolean) {
    this.wakewordTriggered = wakewordTriggered;
  }

  muteMic(mute: boolean) {
    this.middlewareActions.voiceMute(mute, false);
  }

  waitForTts({ fileName, fileLength }: Tts): Promise<void> {
    this.playTts(fileName);
    return new Promise((resolve) => {
      setTimeout(resolve, fileLength + 1000);
    });
  }

  playTts(fileName: string) {
    this.interappActions.getTts(fileName);
  }

  pause() {
    this.rootStore.playerStore.pause();
  }

  setButtonsEnabled(buttonsEnabled: boolean) {
    this.buttonsEnabled = buttonsEnabled;
  }

  setDialPressEnabled(dialPressed: boolean) {
    this.dialPressEnabled = dialPressed;
  }

  setDialTurnEnabled(dialTurned: boolean) {
    this.dialTurnEnabled = dialTurned;
  }

  setBackEnabled(backPressed: boolean) {
    this.backEnabled = backPressed;
  }

  handleDialTurn() {
    if (this.noInteractionModal) {
      this.noInteractionModal.currentOption =
        this.noInteractionModal.currentOption ===
        NoInteractionModalOption.CONTINUE
          ? NoInteractionModalOption.END
          : NoInteractionModalOption.CONTINUE;
    } else if (this.dialTurnEnabled) {
      this.dialTurnCounter++;
    }
  }

  handleDialPress() {
    if (this.noInteractionModal) {
      switch (this.noInteractionModal.currentOption) {
        case NoInteractionModalOption.CONTINUE:
          this.rootStore.ubiLogger.onboardingUbiLogger.logNoInteractionContinueButtonDialPress(
            OnboardingStepId[OnboardingStepId.LEARN_TACTILE],
          );
          this.continueOnboarding();
          break;
        case NoInteractionModalOption.END:
          this.rootStore.ubiLogger.onboardingUbiLogger.logNoInteractionEndButtonDialPress(
            OnboardingStepId[OnboardingStepId.LEARN_TACTILE],
            this.rootStore.viewStore.currentView,
          );
          this.endDuringTactile();
          break;
        default:
          break;
      }
    } else if (this.dialPressEnabled) {
      this.dialPressCounter++;
    }
  }

  handleBack() {
    if (this.noInteractionModal) {
      this.rootStore.ubiLogger.onboardingUbiLogger.logNoInteractionBackButtonPress(
        OnboardingStepId[OnboardingStepId.LEARN_TACTILE],
      );
      this.waitForTts(this.noInteractionModal.ttsToRepeat);
      this.hideNoInteractionModal();
    } else if (this.backEnabled) {
      this.backCounter++;
    }
  }

  get isOnboardingOngoing(): boolean {
    const { viewStore, remoteControlStore, overlayController } = this.rootStore;
    return (
      AppView.ONBOARDING === viewStore.appView &&
      remoteControlStore.interappConnected &&
      !overlayController.anyOverlayIsShowing
    );
  }

  handleTracklistError() {
    this.setOnboardingFinished();
    this.playTts(learnTactileTTS[LearnTactileTtsNames.END_TOUR].fileName);
    this.rootStore.viewStore.backToContentShelf();
  }

  handleStartClick = () => {
    this.rootStore.ubiLogger.onboardingUbiLogger.logStartClicked(
      OnboardingStepId[OnboardingStepId.LEARN_VOICE],
    );
    this.setOnboaringView(OnboardingStepId.LEARN_VOICE);
    this.callMWtoFinishOnboarding();
  };
}

export default OnboardingStore;

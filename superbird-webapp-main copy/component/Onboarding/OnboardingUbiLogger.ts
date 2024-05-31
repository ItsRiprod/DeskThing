import {
  CarOnboardingStartCarthingosEventFactory,
  createCarOnboardingStartCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-onboarding-start-carthingos/CarOnboardingStartCarthingosEventFactory';

import {
  CarOnboardingLearnVoiceCarthingosEventFactory,
  createCarOnboardingLearnVoiceCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-onboarding-learn-voice-carthingos/CarOnboardingLearnVoiceCarthingosEventFactory';

import {
  CarOnboardingLearnTactileCarthingosEventFactory,
  createCarOnboardingLearnTactileCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-onboarding-learn-tactile-carthingos/CarOnboardingLearnTactileCarthingosEventFactory';

import UbiLogger from 'eventhandler/UbiLogger';
import { LearnVoiceStepId } from 'store/OnboardingStore';
import { View } from 'store/ViewStore';

class OnboardingUbiLogger {
  ubiLogger: UbiLogger;
  carOnboardingStartCarthingosEventFactory: CarOnboardingStartCarthingosEventFactory;
  carOnboardingLearnVoiceCarthingosEventFactory: CarOnboardingLearnVoiceCarthingosEventFactory;
  carOnboardingLearnTactileCarthingosEventFactory: CarOnboardingLearnTactileCarthingosEventFactory;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.carOnboardingStartCarthingosEventFactory =
      createCarOnboardingStartCarthingosEventFactory();
    this.carOnboardingLearnVoiceCarthingosEventFactory =
      createCarOnboardingLearnVoiceCarthingosEventFactory();
    this.carOnboardingLearnTactileCarthingosEventFactory =
      createCarOnboardingLearnTactileCarthingosEventFactory();
  }

  logStartClicked = (destination: string) => {
    const event = this.carOnboardingStartCarthingosEventFactory
      .startOnboardingButtonFactory()
      .hitUiNavigate({ destination: destination });
    this.ubiLogger.logInteraction(event);
  };

  logStartShown = () => {
    const event = this.carOnboardingStartCarthingosEventFactory.impression();
    this.ubiLogger.logImpression(event);
  };

  logFirstUpShown = () => {
    const event = this.carOnboardingLearnVoiceCarthingosEventFactory
      .firstUpContainerFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logTryPlayPlaylistShown = () => {
    const event = this.carOnboardingLearnVoiceCarthingosEventFactory
      .tryPlayingPlaylistContainerFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logTrySkipNextShown = () => {
    const event = this.carOnboardingLearnVoiceCarthingosEventFactory
      .trySkipNextContainerFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logFirstUpSkipClicked = () => {
    const event = this.carOnboardingLearnVoiceCarthingosEventFactory
      .firstUpContainerFactory()
      .skipButtonFactory()
      .hitUiNavigate({
        destination: LearnVoiceStepId[LearnVoiceStepId.LAST_STEP],
      });
    this.ubiLogger.logInteraction(event);
  };

  logNextSongSkipClicked = () => {
    const event = this.carOnboardingLearnVoiceCarthingosEventFactory
      .trySkipNextContainerFactory()
      .skipButtonFactory()
      .hitUiNavigate({
        destination: LearnVoiceStepId[LearnVoiceStepId.LAST_STEP],
      });
    this.ubiLogger.logInteraction(event);
  };

  logPlayPlaylistSkipClicked = () => {
    const event = this.carOnboardingLearnVoiceCarthingosEventFactory
      .tryPlayingPlaylistContainerFactory()
      .skipButtonFactory()
      .hitUiNavigate({
        destination: LearnVoiceStepId[LearnVoiceStepId.LAST_STEP],
      });
    this.ubiLogger.logInteraction(event);
  };

  logErrorShown = (identifier: string, reason: string) => {
    const event = this.carOnboardingLearnVoiceCarthingosEventFactory
      .errorContainerFactory({ identifier, reason })
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logErrorSkipClicked = (id: string, reason: string) => {
    const event = this.carOnboardingLearnVoiceCarthingosEventFactory
      .errorContainerFactory({ identifier: id, reason: reason })
      .nextButtonFactory()
      .hitUiNavigate({
        destination: LearnVoiceStepId[LearnVoiceStepId.LAST_STEP],
      });
    this.ubiLogger.logInteraction(event);
  };

  logLastStepShown = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .lastStepContainerFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logLastStepSkipClicked = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .lastStepContainerFactory()
      .skipButtonFactory()
      .hitUiNavigate({
        destination: View.NPV,
      });
    this.ubiLogger.logInteraction(event);
  };

  logShelfDialTurnShown = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .contentShelfContainerFactory()
      .rotateDialIndicatorFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logShelfDialPressShown = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .contentShelfContainerFactory()
      .pressDialIndicatorFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logShelfBackPressShown = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .contentShelfContainerFactory()
      .backButtonIndicatorFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logTrackListBackPressShown = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .trackViewContainerFactory()
      .backButtonIndicatorFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logTrackListDialPressShown = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .trackViewContainerFactory()
      .pressDialIndicatorFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logNpvDialPressShown = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .npvContainerFactory()
      .pressDialIndicatorFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logNpvBackPressShown = () => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .npvContainerFactory()
      .backButtonIndicatorFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logNoInteractionModalShown = (reason: string) => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .noInteractionContainerFactory({ reason })
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logNoInteractionContinueButtonClicked = (reason: string) => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .noInteractionContainerFactory({ reason })
      .continueButtonFactory()
      .hitUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logNoInteractionEndButtonClicked = (reason: string, destination: string) => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .noInteractionContainerFactory({ reason })
      .endButtonFactory()
      .hitUiNavigate({ destination });
    this.ubiLogger.logInteraction(event);
  };

  logNoInteractionContinueButtonDialPress = (reason: string) => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .noInteractionContainerFactory({ reason })
      .continueButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logNoInteractionEndButtonDialPress = (
    reason: string,
    destination: string,
  ) => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .noInteractionContainerFactory({ reason })
      .endButtonFactory()
      .keyStrokeUiNavigate({ destination });
    this.ubiLogger.logInteraction(event);
  };

  logNoInteractionBackButtonPress = (reason: string) => {
    const event = this.carOnboardingLearnTactileCarthingosEventFactory
      .noInteractionContainerFactory({ reason })
      .backButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };
}

export default OnboardingUbiLogger;

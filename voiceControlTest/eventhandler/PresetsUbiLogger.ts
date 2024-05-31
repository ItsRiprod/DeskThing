import {
  CarPresetsCarthingosEventFactory,
  createCarPresetsCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-presets-carthingos/CarPresetsCarthingosEventFactory';
import UbiLogger from './UbiLogger';
import { PresetNumber } from 'store/PresetsDataStore';

class PresetsUbiLogger {
  ubiLogger: UbiLogger;
  carPresetsCarthingosEventFactory: CarPresetsCarthingosEventFactory;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.carPresetsCarthingosEventFactory =
      createCarPresetsCarthingosEventFactory();
  }

  logPresetsImpression = () => {
    const event = this.carPresetsCarthingosEventFactory.impression();
    this.ubiLogger.logImpression(event);
  };

  logPresetButtonOneClicked = (uri: string): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .presetOneButtonFactory()
        .keyStrokePlay({ itemToBePlayed: uri }),
    );

  logPresetButtonTwoClicked = (uri: string): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .presetTwoButtonFactory()
        .keyStrokePlay({ itemToBePlayed: uri }),
    );

  logPresetButtonThreeClicked = (uri: string): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .presetThreeButtonFactory()
        .keyStrokePlay({ itemToBePlayed: uri }),
    );

  logPresetButtonFourClicked = (uri: string): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .presetFourButtonFactory()
        .keyStrokePlay({ itemToBePlayed: uri }),
    );

  logPlaceholderPresetHardwareButtonClicked = () =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .presetTwoButtonFactory()
        .keyStrokeUiReveal(),
    );

  logPresetOneSaved = (uri: string) => {
    const event = this.carPresetsCarthingosEventFactory
      .presetOneButtonFactory()
      .longHitSavePresetContent({
        contentToBePreset: uri,
      });
    this.ubiLogger.logInteraction(event);
  };

  logPresetTwoSaved = (uri: string) => {
    const event = this.carPresetsCarthingosEventFactory
      .presetTwoButtonFactory()
      .longHitSavePresetContent({
        contentToBePreset: uri,
      });
    this.ubiLogger.logInteraction(event);
  };

  logPresetThreeSaved = (uri: string) => {
    const event = this.carPresetsCarthingosEventFactory
      .presetThreeButtonFactory()
      .longHitSavePresetContent({
        contentToBePreset: uri,
      });
    this.ubiLogger.logInteraction(event);
  };

  logPresetFourSaved = (uri: string) => {
    const event = this.carPresetsCarthingosEventFactory
      .presetFourButtonFactory()
      .longHitSavePresetContent({
        contentToBePreset: uri,
      });
    this.ubiLogger.logInteraction(event);
  };

  logDialTurn = (presetNumber: PresetNumber, uri: string): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .dialFactory({ position: presetNumber, uri: uri })
        .rotateUiSelect(),
    );

  logDialPress = (position: PresetNumber, uri: string): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .dialFactory({ position, uri })
        .keyStrokePlay({ itemToBePlayed: uri }),
    );

  logTouchToPlay = (position: PresetNumber, uri: string): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .presetCardFactory({
          position,
          uri,
        })
        .hitPlay({ itemToBePlayed: uri }),
    );

  logTouchPlaceHolder = (position: PresetNumber): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory
        .placeholderPresetCardFactory({ position })
        .hitNoAction(),
    );

  logSwipeDown = (): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory.swipeUiReveal(),
    );

  logSwipeUp = (): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory.swipeUiHide(),
    );

  logBackButtonClick = (): string =>
    this.ubiLogger.logInteraction(
      this.carPresetsCarthingosEventFactory.backButtonFactory().hitUiHide(),
    );
}

export default PresetsUbiLogger;

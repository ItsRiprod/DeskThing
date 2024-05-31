import {
  CarNowPlayingViewOtherMediaCarthingosEventFactory,
  createCarNowPlayingViewOtherMediaCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-now-playing-view-other-media-carthingos';
import UbiLogger from 'eventhandler/UbiLogger';
import { OptionsMenuItemId } from 'store/SettingsStore';

class OtherMediaUbiLogger {
  ubiLogger: UbiLogger;
  otherMediaEventFactory: CarNowPlayingViewOtherMediaCarthingosEventFactory;
  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.otherMediaEventFactory =
      createCarNowPlayingViewOtherMediaCarthingosEventFactory();
  }

  logImpression() {
    const event = this.otherMediaEventFactory.impression();
    this.ubiLogger.logImpression(event);
  }

  logPlaySpotifyClicked() {
    const event = this.otherMediaEventFactory
      .playSpotifyButtonFactory()
      .hitUiNavigate({ destination: 'Spotify' });
    this.ubiLogger.logInteraction(event);
  }

  logArtworkClicked(isPlaying: boolean, currentTrackUri: string): string {
    const event = isPlaying
      ? this.otherMediaEventFactory.nowPlayingArtworkFactory().hitPause({
          itemToBePaused: currentTrackUri,
        })
      : this.otherMediaEventFactory.nowPlayingArtworkFactory().hitResume({
          itemToBeResumed: currentTrackUri,
        });
    return this.ubiLogger.logInteraction(event);
  }

  logPauseButtonClicked(currentTrackUri: string) {
    const event = this.otherMediaEventFactory
      .controlButtonsFactory()
      .playPauseButtonFactory()
      .hitPause({ itemToBePaused: currentTrackUri });
    return this.ubiLogger.logInteraction(event);
  }

  logPlayButtonClicked(currentTrackUri: string) {
    const event = this.otherMediaEventFactory
      .controlButtonsFactory()
      .playPauseButtonFactory()
      .hitResume({
        itemToBeResumed: currentTrackUri,
      });
    return this.ubiLogger.logInteraction(event);
  }

  logSkipPrevClicked(
    currentTrackUri: string,
    currentPositionMs: number,
    currentTrackDuration: number,
  ) {
    const event = this.otherMediaEventFactory
      .controlButtonsFactory()
      .skipPreviousButtonFactory()
      .hitSkipToPrevious({
        itemToBeSkipped: currentTrackUri,
        positionMs: currentPositionMs,
        totalContentMs: currentTrackDuration,
      });
    return this.ubiLogger.logInteraction(event);
  }

  logSkipNextClicked(
    currentTrackUri: string,
    currentPositionMs: number,
    currentTrackDuration: number,
  ) {
    const event = this.otherMediaEventFactory
      .controlButtonsFactory()
      .skipNextButtonFactory()
      .hitSkipToNext({
        itemToBeSkipped: currentTrackUri,
        positionMs: currentPositionMs,
        totalContentMs: currentTrackDuration,
      });
    return this.ubiLogger.logInteraction(event);
  }

  logDecreaseVolumeClicked() {
    const event = this.otherMediaEventFactory
      .dialButtonFactory()
      .rotateDecreaseVolume();
    this.ubiLogger.logInteraction(event);
  }

  logIncreaseVolumeClicked() {
    const event = this.otherMediaEventFactory
      .dialButtonFactory()
      .rotateIncreaseVolume();
    this.ubiLogger.logInteraction(event);
  }

  logDialPlayClicked(currentTrackUri: string) {
    const event = this.otherMediaEventFactory
      .dialButtonFactory()
      .keyStrokeResume({
        itemToBeResumed: currentTrackUri,
      });
    return this.ubiLogger.logInteraction(event);
  }

  logDialPauseClicked(currentTrackUri: string) {
    const event = this.otherMediaEventFactory
      .dialButtonFactory()
      .keyStrokePause({
        itemToBePaused: currentTrackUri,
      });
    return this.ubiLogger.logInteraction(event);
  }

  logBackClicked(view: string) {
    const event = this.otherMediaEventFactory
      .backButtonFactory()
      .keyStrokeUiNavigate({ destination: view });
    this.ubiLogger.logInteraction(event);
  }

  logWindNoiseImpression() {
    const event = this.otherMediaEventFactory
      .windNoiseBannerFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  }

  logWindNoiseDismissal() {
    const event = this.otherMediaEventFactory
      .windNoiseBannerFactory()
      .dismissButtonFactory()
      .hitUiHide();
    this.ubiLogger.logInteraction(event);
  }

  logWindNoiseLearnMore() {
    const event = this.otherMediaEventFactory
      .windNoiseBannerFactory()
      .learnMoreButtonFactory()
      .hitUiNavigate({
        destination: OptionsMenuItemId.AIR_VENT_INTERFERENCE,
      });
    this.ubiLogger.logInteraction(event);
  }
}

export default OtherMediaUbiLogger;

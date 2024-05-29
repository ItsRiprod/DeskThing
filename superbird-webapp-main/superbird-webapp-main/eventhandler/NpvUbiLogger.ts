import {
  CarNowPlayingViewCarthingosEventFactory,
  createCarNowPlayingViewCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-now-playing-view-carthingos/CarNowPlayingViewCarthingosEventFactory';
import { SEEK_MS_PODCAST_EPISODE } from 'component/Npv/ControlButtons/ControlButtonsUiState';
import UbiLogger from './UbiLogger';
import { OptionsMenuItemId } from 'store/SettingsStore';

class NpvUbiLogger {
  ubiLogger: UbiLogger;
  carNowPlayingViewCarthingosEventFactory: CarNowPlayingViewCarthingosEventFactory;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.carNowPlayingViewCarthingosEventFactory =
      createCarNowPlayingViewCarthingosEventFactory();
  }

  logImpression = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory.impression();
    this.ubiLogger.logImpression(event);
  };

  logArtworkClicked = (isPlaying: boolean, currentTrackUri: string): string => {
    const event = isPlaying
      ? this.carNowPlayingViewCarthingosEventFactory
          .trackInformationFactory()
          .nowPlayingImageFactory()
          .hitPause({
            itemToBePaused: currentTrackUri,
          })
      : this.carNowPlayingViewCarthingosEventFactory
          .trackInformationFactory()
          .nowPlayingImageFactory()
          .hitResume({
            itemToBeResumed: currentTrackUri,
          });
    return this.ubiLogger.logInteraction(event);
  };

  logRemoveLikeClicked = (currentTrackUri: string) => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .saveButtonFactory()
      .hitRemoveLike({
        itemNoLongerLiked: currentTrackUri,
      });
    this.ubiLogger.logInteraction(event);
  };

  logLikeClicked = (currentTrackUri: string) => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .saveButtonFactory()
      .hitLike({ itemToBeLiked: currentTrackUri });
    this.ubiLogger.logInteraction(event);
  };

  logShuffleDisableClicked = (): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .shuffleButtonFactory()
      .hitShuffleDisable();
    return this.ubiLogger.logInteraction(event);
  };

  logShuffleEnableClicked = (): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .shuffleButtonFactory()
      .hitShuffleEnable();
    return this.ubiLogger.logInteraction(event);
  };

  logPauseButtonClicked = (currentTrackUri: string): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .playPauseButtonFactory()
      .hitPause({ itemToBePaused: currentTrackUri });
    return this.ubiLogger.logInteraction(event);
  };

  logPlayButtonClicked = (currentTrackUri: string): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .playPauseButtonFactory()
      .hitResume({
        itemToBeResumed: currentTrackUri,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logPodcastSpeedClicked = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .playbackSpeedButtonFactory()
      .hitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logSeekBackClicked = (): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .seekBackButtonFactory()
      .hitSeekByTime({
        msSeekedOffset: -SEEK_MS_PODCAST_EPISODE,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logSeekForwardClicked = (): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .seekForwardButtonFactory()
      .hitSeekByTime({
        msSeekedOffset: SEEK_MS_PODCAST_EPISODE,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logSkipPrevClicked = (
    currentTrackUri: string,
    currentPositionMs: number,
    currentTrackDuration: number,
  ): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .skipPreviousButtonFactory()
      .hitSkipToPrevious({
        itemToBeSkipped: currentTrackUri,
        positionMs: currentPositionMs,
        totalContentMs: currentTrackDuration,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logSkipNextClicked = (
    currentTrackUri: string,
    currentPositionMs: number,
    currentTrackDuration: number,
  ): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .skipNextButtonFactory()
      .hitSkipToNext({
        itemToBeSkipped: currentTrackUri,
        positionMs: currentPositionMs,
        totalContentMs: currentTrackDuration,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logContextTitleClicked = (currentContextUri: string) => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .trackInformationFactory()
      .contextTitleLabelFactory()
      .hitUiNavigate({
        destination: currentContextUri,
      });
    this.ubiLogger.logInteraction(event);
  };

  logGoToQueue = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .trackInformationFactory()
      .contextTitleLabelFactory()
      .hitUiNavigate({
        destination: 'queue',
      });
    this.ubiLogger.logInteraction(event);
  };

  logDialPressGoToQueue = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .dialButtonFactory()
      .longHitUiNavigate({
        destination: 'queue',
      });
    this.ubiLogger.logInteraction(event);
  };

  logDecreaseVolumeClicked = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .dialButtonFactory()
      .rotateDecreaseVolume();
    this.ubiLogger.logInteraction(event);
  };

  logIncreaseVolumeClicked = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .dialButtonFactory()
      .rotateIncreaseVolume();
    this.ubiLogger.logInteraction(event);
  };

  logDialPlayClicked = (currentTrackUri: string): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .dialButtonFactory()
      .keyStrokeResume({
        itemToBeResumed: currentTrackUri,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logDialPauseClicked = (currentTrackUri: string): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .dialButtonFactory()
      .keyStrokePause({
        itemToBePaused: currentTrackUri,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logBackClicked = (view: string) => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .backButtonFactory()
      .keyStrokeUiNavigate({ destination: view });
    this.ubiLogger.logInteraction(event);
  };

  logSwipeSkipPrevious = (
    currentTrackUri: string,
    currentPositionMs: number,
    currentTrackDuration: number,
  ): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .trackInformationFactory()
      .swipeRightSkipToPrevious({
        itemToBeSkipped: currentTrackUri,
        positionMs: currentPositionMs,
        totalContentMs: currentTrackDuration,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logSwipeSkipNext = (
    currentTrackUri: string,
    currentPositionMs: number,
    currentTrackDuration: number,
  ): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .trackInformationFactory()
      .swipeLeftSkipToNext({
        itemToBeSkipped: currentTrackUri,
        positionMs: currentPositionMs,
        totalContentMs: currentTrackDuration,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logDismissScrubber = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .backButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logDialSeekForward = (offsetMs: number): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .dialButtonFactory()
      .rotateSeekByTime({
        msSeekedOffset: offsetMs,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logDialSeekBackwards = (offsetMs: number): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .dialButtonFactory()
      .rotateSeekByTime({
        msSeekedOffset: offsetMs,
      });
    return this.ubiLogger.logInteraction(event);
  };

  logOpenScrubber = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .progressBarFactory()
      .hitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logWindNoiseImpression = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .windNoiseContainerFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logWindNoiseDismissal = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .windNoiseContainerFactory()
      .dismissButtonFactory()
      .hitUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logWindNoiseLearnMore = () => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .windNoiseContainerFactory()
      .learnMoreButtonFactory()
      .hitUiNavigate({
        destination: OptionsMenuItemId.AIR_VENT_INTERFERENCE,
      });
    this.ubiLogger.logInteraction(event);
  };

  logSeekToTimeScrubber = (trackTime: number): string => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .scrubberFactory()
      .hitSeekToTime({ msToSeekTo: trackTime });
    return this.ubiLogger.logInteraction(event);
  };

  logTipImpression = (action: string) => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .tipFactory({ reason: action })
      .impression();
    return this.ubiLogger.logImpression(event);
  };

  logTipDismissal = (action: string) => {
    const event = this.carNowPlayingViewCarthingosEventFactory
      .tipFactory({ reason: action })
      .hitUiHide();
    return this.ubiLogger.logInteraction(event);
  };
}

export default NpvUbiLogger;

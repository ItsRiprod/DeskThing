import ControlButtonsUiState from 'component/Npv/ControlButtons/ControlButtonsUiState';
import PlayingInfoUiState from 'component/Npv/PlayingInfo/PlayingInfoUiState';
import ScrubbingUiState from 'component/Npv/Scrubbing/ScrubbingUiState';
import SwipeHandler from 'component/Npv/SwipeHandler';
import VolumeUiState from 'component/Npv/Volume/VolumeUiState';
import PodcastSpeedUiState from 'component/Npv/PodcastSpeedOptions/PodcastSpeedUiState';
import { makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';
import TipsUiState from 'component/Npv/Tips/TipsUiState';
import {
  createOtherMediaController,
  OtherMediaController,
} from 'component/Npv/OtherMedia/OtherMediaController';
import MiddlewareActions from 'middleware/MiddlewareActions';
import {
  createNpvController,
  NpvController,
} from 'component/Npv/NpvController';

class NpvStore {
  swipeHandler: SwipeHandler;
  playingInfoUiState: PlayingInfoUiState;
  scrubbingUiState: ScrubbingUiState;
  volumeUiState: VolumeUiState;
  controlButtonsUiState: ControlButtonsUiState;
  podcastSpeedUiState: PodcastSpeedUiState;
  tipsUiState: TipsUiState;
  otherMediaController: OtherMediaController;
  npvController: NpvController;

  constructor(rootStore: RootStore, middlewareActions: MiddlewareActions) {
    makeAutoObservable(this, {
      swipeHandler: false,
      playingInfoUiState: false,
      scrubbingUiState: false,
      controlButtonsUiState: false,
      volumeUiState: false,
      podcastSpeedUiState: false,
      tipsUiState: false,
      otherMediaController: false,
      npvController: false,
    });

    this.swipeHandler = new SwipeHandler(
      rootStore.playerStore,
      rootStore.timerStore,
      rootStore.ubiLogger.npvUbiLogger,
    );

    this.playingInfoUiState = new PlayingInfoUiState(
      rootStore.imageStore,
      rootStore.overlayController,
      rootStore.playerStore,
      rootStore.queueStore,
      rootStore.viewStore,
      rootStore.tracklistStore,
      rootStore.voiceStore,
      rootStore.remoteConfigStore,
      rootStore.airVentInterferenceController.windAlertBannerUiState,
      this.swipeHandler,
      rootStore.ubiLogger.npvUbiLogger,
    );

    this.scrubbingUiState = new ScrubbingUiState(
      rootStore.imageStore,
      rootStore.playerStore,
      rootStore.timerStore,
      rootStore.ubiLogger.npvUbiLogger,
    );

    this.otherMediaController = createOtherMediaController(
      rootStore.playerStore,
      rootStore.sessionStateStore,
      middlewareActions,
      rootStore.ubiLogger,
    );

    this.podcastSpeedUiState = new PodcastSpeedUiState(
      rootStore.playerStore,
      rootStore.overlayController,
      rootStore.hardwareStore,
      rootStore.ubiLogger.podcastSpeedOptionsUbiLogger,
      rootStore.remoteConfigStore,
      rootStore.podcastSpeedStore,
    );

    this.controlButtonsUiState = new ControlButtonsUiState(
      rootStore.imageStore,
      rootStore.playerStore,
      rootStore.timerStore,
      rootStore.viewStore,
      this.swipeHandler,
      rootStore.overlayController,
      rootStore.remoteConfigStore,
      this.podcastSpeedUiState,
      rootStore.savedStore,
      rootStore.voiceStore,
      middlewareActions,
      rootStore.ubiLogger.npvUbiLogger,
      rootStore.ubiLogger.otherMediaUbiLogger,
      this.playingInfoUiState,
      rootStore.permissionsStore,
    );

    this.volumeUiState = new VolumeUiState(
      rootStore.imageStore,
      rootStore.playerStore,
      rootStore.remoteConfigStore,
      rootStore.sessionStateStore,
      rootStore.volumeStore,
    );

    this.tipsUiState = new TipsUiState(
      rootStore.overlayController,
      rootStore.playerStore,
      rootStore.viewStore,
      rootStore.tipsStore,
      rootStore.sessionStateStore,
      rootStore.remoteConfigStore,
      rootStore.ubiLogger.npvUbiLogger,
      rootStore.onboardingStore,
      rootStore.persistentStorage,
    );

    this.npvController = createNpvController(
      rootStore.playerStore,
      rootStore.queueStore,
      rootStore.viewStore,
      this,
      rootStore.overlayController,
      rootStore.volumeStore,
      rootStore.ubiLogger,
    );
  }
}

export default NpvStore;

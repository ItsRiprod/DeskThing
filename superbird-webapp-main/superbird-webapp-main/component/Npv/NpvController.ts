import UbiLogger from 'eventhandler/UbiLogger';
import PlayerStore from 'store/PlayerStore';
import QueueStore from 'store/QueueStore';
import ViewStore from 'store/ViewStore';
import NpvStore from 'store/NpvStore';
import VolumeStore from 'store/VolumeStore';
import { OverlayController } from 'component/Overlays/OverlayController';

export type NpvController = ReturnType<typeof createNpvController>;

export const createNpvController = (
  playerStore: PlayerStore,
  queueStore: QueueStore,
  viewStore: ViewStore,
  npvStore: NpvStore,
  overlayController: OverlayController,
  volumeStore: VolumeStore,
  ubiLogger: UbiLogger,
) => {
  return {
    handleDialBack(): void {
      npvStore.tipsUiState.dismissVisibleTip();
      if (npvStore.scrubbingUiState.isScrubbing) {
        npvStore.scrubbingUiState.stopScrubbing();
        ubiLogger.npvUbiLogger.logDismissScrubber();
      } else {
        if (viewStore.viewUnderCurrentView !== undefined) {
          if (playerStore.isPlayingSpotify) {
            ubiLogger.npvUbiLogger.logBackClicked(
              viewStore.viewUnderCurrentView,
            );
          } else {
            ubiLogger.otherMediaUbiLogger.logBackClicked(
              viewStore.viewUnderCurrentView,
            );
          }
        }
        if (npvStore.volumeUiState.shouldShowVolume) {
          npvStore.volumeUiState.clearVolumeTimer();
        }
        viewStore.back();
      }
    },

    handleDialPress(): void {
      if (npvStore.scrubbingUiState.isScrubbing) {
        npvStore.scrubbingUiState.stopScrubbing();
      } else {
        if (playerStore.playing) {
          if (playerStore.isPlayingSpotify) {
            ubiLogger.npvUbiLogger.logDialPauseClicked(
              playerStore.currentTrackUri,
            );
          } else {
            ubiLogger.otherMediaUbiLogger.logDialPauseClicked(
              playerStore.currentTrackUri,
            );
          }
          playerStore.pause();
        } else {
          if (playerStore.isPlayingSpotify) {
            ubiLogger.npvUbiLogger.logDialPlayClicked(
              playerStore.currentTrackUri,
            );
          } else {
            ubiLogger.otherMediaUbiLogger.logDialPlayClicked(
              playerStore.currentTrackUri,
            );
          }
          playerStore.play();
        }
      }
    },

    handleDialLongPress(): void {
      if (
        playerStore.isPlayingSpotify &&
        !overlayController.anyOverlayIsShowing
      ) {
        ubiLogger.npvUbiLogger.logDialPressGoToQueue();
        queueStore.queueUiState.displayQueue();
      }
    },

    handleDialRight(): void {
      npvStore.tipsUiState.dismissVisibleTip();
      if (npvStore.scrubbingUiState.isScrubbing) {
        const seekedMs = 5000;
        ubiLogger.npvUbiLogger.logDialSeekForward(seekedMs);
        playerStore.seekForward(seekedMs);
        npvStore.scrubbingUiState.resetScrubbingViewTimer();
      } else {
        npvStore.volumeUiState.resetShowVolumeTimer();
        if (playerStore.isPlayingSpotify) {
          ubiLogger.npvUbiLogger.logIncreaseVolumeClicked();
        } else {
          ubiLogger.otherMediaUbiLogger.logIncreaseVolumeClicked();
        }
        volumeStore.increaseVolume();
      }
    },

    handleDialLeft(): void {
      npvStore.tipsUiState.dismissVisibleTip();
      if (npvStore.scrubbingUiState.isScrubbing) {
        const seekedMs = 5000;
        ubiLogger.npvUbiLogger.logDialSeekBackwards(-seekedMs);
        playerStore.seekBack(seekedMs);
        npvStore.scrubbingUiState.resetScrubbingViewTimer();
      } else {
        if (playerStore.isPlayingSpotify) {
          ubiLogger.npvUbiLogger.logDecreaseVolumeClicked();
        } else {
          ubiLogger.otherMediaUbiLogger.logDecreaseVolumeClicked();
        }
        npvStore.volumeUiState.resetShowVolumeTimer();
        volumeStore.decreaseVolume();
      }
    },
  };
};

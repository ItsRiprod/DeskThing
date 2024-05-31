import { createOtherMediaUiState } from 'component/Npv/OtherMedia/OtherMediaUiState';
import UbiLogger from 'eventhandler/UbiLogger';
import MiddlewareActions from 'middleware/MiddlewareActions';
import PlayerStore from 'store/PlayerStore';
import SessionStateStore from 'store/SessionStateStore';

export type OtherMediaController = ReturnType<
  typeof createOtherMediaController
>;

export const createOtherMediaController = (
  playerStore: PlayerStore,
  sessionStateStore: SessionStateStore,
  middlewareActions: MiddlewareActions,
  ubiLogger: UbiLogger,
) => {
  return {
    otherMediaUiState: createOtherMediaUiState(playerStore, sessionStateStore),

    handleBackToSpotifyClick() {
      ubiLogger.otherMediaUbiLogger.logPlaySpotifyClicked();
      middlewareActions.returnToSpotify();
      playerStore.play();
    },

    handleArtworkClick() {
      ubiLogger.otherMediaUbiLogger.logArtworkClicked(
        playerStore.playing,
        playerStore.currentTrackUri,
      );
      playerStore.togglePlayPause();
    },

    logImpression() {
      ubiLogger.otherMediaUbiLogger.logImpression();
    },
  };
};

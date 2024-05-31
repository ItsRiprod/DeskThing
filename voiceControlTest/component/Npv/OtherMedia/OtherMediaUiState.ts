import PlayerStore from 'store/PlayerStore';
import SessionStateStore from 'store/SessionStateStore';

export const createOtherMediaUiState = (
  playerStore: PlayerStore,
  sessionStateStore: SessionStateStore,
) => ({
  get shouldShowContent() {
    return sessionStateStore.isLoggedIn;
  },
  get currentItem() {
    return playerStore.currentTrack;
  },
  get otherActiveApp() {
    return playerStore.otherActiveApp;
  },
  get title() {
    return playerStore.currentTrack.name;
  },
  get subtitle() {
    return this.currentItem.artist.name;
  },
});

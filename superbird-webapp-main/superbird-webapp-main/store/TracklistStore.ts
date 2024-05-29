import { RootStore } from './RootStore';
import TracklistUiState from 'component/Tracklist/TracklistUiState';

class TracklistStore {
  rootStore: RootStore;
  tracklistUiState: TracklistUiState;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    this.tracklistUiState = new TracklistUiState(rootStore);
  }

  reset(): void {
    this.tracklistUiState.reset();
  }
}

export default TracklistStore;

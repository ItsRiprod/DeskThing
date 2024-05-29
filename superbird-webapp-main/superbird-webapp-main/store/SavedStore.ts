import InterappActions from 'middleware/InterappActions';
import { ObservableMap, runInAction } from 'mobx';
import ErrorHandler from 'eventhandler/ErrorHandler';
import PlayerStore from './PlayerStore';

class SavedStore {
  interappActions: InterappActions;
  errorHandler: ErrorHandler;

  constructor(
    playerStore: PlayerStore,
    interappActions: InterappActions,
    errorHandler: ErrorHandler,
  ) {
    this.errorHandler = errorHandler;
    this.interappActions = interappActions;

    playerStore.onTrackChange((track) => {
      if (track.is_episode) {
        this.loadSavedState(track.uri);
      } else {
        this.setSavedLocal(track.uri, track.saved);
      }
    });
  }

  saved: ObservableMap<string, boolean> = new ObservableMap<string, boolean>();
  loading: Map<string, boolean> = new Map<string, boolean>();

  isSaved(uri: string): boolean {
    return this.saved.get(uri) === true;
  }

  async loadSavedState(uri: string): Promise<void> {
    if (this.loading.get(uri)) {
      return;
    }

    try {
      this.loading.set(uri, true);
      const { saved } = await this.interappActions.getSaved(uri);
      runInAction(() => {
        this.saved.set(uri, saved);
      });
    } catch (e: any) {
      this.errorHandler.logUnexpectedError(e, 'Failed to get saved');
    } finally {
      this.loading.set(uri, false);
    }
  }

  async setSaved(uri: string, isSaved: boolean) {
    try {
      this.setSavedLocal(uri, isSaved);
      await this.interappActions.setSaved(isSaved, uri);
    } catch (e: any) {
      this.setSavedLocal(uri, !isSaved);
      this.errorHandler.logUnexpectedError(e, 'Failed to toggle save state');
    }
  }

  setSavedLocal(uri: string, isSaved: boolean) {
    runInAction(() => this.saved.set(uri, isSaved));
  }
}

export default SavedStore;

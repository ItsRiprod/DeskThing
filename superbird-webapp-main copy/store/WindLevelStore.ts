import { makeAutoObservable, reaction } from 'mobx';
import Socket from 'Socket';
import { RootStore } from './RootStore';
import InterappActions from 'middleware/InterappActions';

export const WIND_NOISE_ALERT_DISABLED_KEY = 'wind_noise_alert_disabled';

type WindLevelMessage = {
  type: string;
  payload: number;
};

class WindLevelStore {
  rootStore: RootStore;
  interappActions: InterappActions;

  constructor(
    rootStore: RootStore,
    socket: Socket,
    interappActions: InterappActions,
  ) {
    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
    });

    this.rootStore = rootStore;

    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
    this.interappActions = interappActions;
  }

  onMiddlewareEvent(msg: any) {
    if (msg.type === 'wind_level') {
      this.onWindLevel(msg);
    }
  }

  currentWindLevel = 0;
  windAlertOnThreshold = 3;
  isOverThreshold = false;

  get alertDisabled(): boolean {
    return Boolean(
      JSON.parse(
        this.rootStore.persistentStorage.getItem(
          WIND_NOISE_ALERT_DISABLED_KEY,
        ) || 'false',
      ),
    );
  }

  onWindLevel({ payload: newWindLevel }: WindLevelMessage) {
    const oldWindLevel = this.currentWindLevel;
    this.currentWindLevel = newWindLevel;
    this.isGoingOverThreshold(oldWindLevel, newWindLevel);
  }

  isGoingOverThreshold(oldWindLevel: number, newWindLevel: number) {
    this.isOverThreshold =
      oldWindLevel < this.windAlertOnThreshold &&
      newWindLevel >= this.windAlertOnThreshold;
  }

  toggleAlertDisabledByUser() {
    this.rootStore.persistentStorage.setItem(
      WIND_NOISE_ALERT_DISABLED_KEY,
      String(!this.alertDisabled),
    );
  }

  // dev options
  setWindLevelAlertThreshold(thresholdNumber: number) {
    this.windAlertOnThreshold = thresholdNumber;
  }

  onWindLvlOverThreshold(callback: () => void) {
    reaction(
      () => this.isOverThreshold,
      () => {
        if (this.isOverThreshold) {
          callback();
        }
      },
    );
  }
}

export default WindLevelStore;

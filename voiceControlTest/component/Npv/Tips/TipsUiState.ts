import NpvUbiLogger from 'eventhandler/NpvUbiLogger';
import { makeAutoObservable, reaction } from 'mobx';
import PlayerStore from 'store/PlayerStore';
import RemoteConfigStore from 'store/RemoteConfigStore';
import SessionStateStore from 'store/SessionStateStore';
import TipsStore, { Tip } from 'store/TipsStore';
import ViewStore from 'store/ViewStore';
import { OverlayController } from 'component/Overlays/OverlayController';
import OnboardingStore from 'store/OnboardingStore';
import SeedableStorageInterface from 'middleware/SeedableStorageInterface';

let showTipTimeoutId: number | undefined = undefined;
let npvIdleTimeoutId: number | undefined = undefined;
let newTrackTimeoutId: number | undefined = undefined;

export const TIPS_ACTIVE_KEY = 'tips_active';
export const OLD_TIPS_DISABLED_KEY = 'tips_disabled';

export const TIPS_INTERACTION_DELAY = 4 * 1000; // in ms
export const TIPS_REQUEST_INTERVAL = 600 * 1000; // in ms
export const TIPS_SHOW_TIME = 8 * 1000; // in ms
export const TIPS_STARTUP_DELAY = 600 * 1000; // in ms
export const TIPS_TRACK_CHANGE_DELAY = 10 * 1000; // in ms

class TipsUiState {
  overlayController: OverlayController;
  playerStore: PlayerStore;
  viewStore: ViewStore;
  tipsStore: TipsStore;
  sessionStateStore: SessionStateStore;
  remoteConfigStore: RemoteConfigStore;
  npvUbiLogger: NpvUbiLogger;
  onboardingStore: OnboardingStore;
  persistentStorage: SeedableStorageInterface;

  isNpvIdle = false;
  isNewTrack = false;
  isIntervalExpired = false;
  hasBeenShown = false;
  fetchTipTimeoutId?: number;

  constructor(
    overlayController: OverlayController,
    playerStore: PlayerStore,
    viewStore: ViewStore,
    tipsStore: TipsStore,
    sessionStateStore: SessionStateStore,
    remoteConfigStore: RemoteConfigStore,
    npvUbiLogger: NpvUbiLogger,
    onboardingStore: OnboardingStore,
    middlewareStorage: SeedableStorageInterface,
  ) {
    this.overlayController = overlayController;
    this.playerStore = playerStore;
    this.viewStore = viewStore;
    this.tipsStore = tipsStore;
    this.sessionStateStore = sessionStateStore;
    this.remoteConfigStore = remoteConfigStore;
    this.npvUbiLogger = npvUbiLogger;
    this.onboardingStore = onboardingStore;
    this.persistentStorage = middlewareStorage;

    makeAutoObservable(this, {
      tipsStore: false,
      playerStore: false,
      remoteConfigStore: false,
      sessionStateStore: false,
      viewStore: false,
      overlayController: false,
      onboardingStore: false,
    });

    this.triggerNpvIdleTimer();
    this.triggerGetTipTimer(true);
    this.onNpvIdleState();

    this.onShouldFetchTip(async () => {
      await this.tipsStore.getNewTip().catch(() => {
        this.setIntervalExpired(false);
        this.triggerGetTipTimer();
      });
    });

    this.playerStore.onTrackChange(() => {
      this.setNewTrack(true);
      window.clearTimeout(newTrackTimeoutId);
      newTrackTimeoutId = window.setTimeout(
        () => this.setNewTrack(false),
        TIPS_TRACK_CHANGE_DELAY,
      );
    });
  }

  get tipToShow(): Tip | undefined {
    if (
      this.tipsStore.tip &&
      this.isNpvIdle &&
      !this.isNewTrack &&
      this.isTipsEnabled
    ) {
      showTipTimeoutId = window.setTimeout(
        () => this.dismissVisibleTip(),
        TIPS_SHOW_TIME,
      );
      return this.tipsStore.tip;
    }
    return undefined;
  }

  private triggerNpvIdleTimer() {
    npvIdleTimeoutId = window.setTimeout(
      () => this.setNpvIdle(true),
      TIPS_INTERACTION_DELAY,
    );
  }

  get shouldFetchTip() {
    return (
      this.isNpvIdle &&
      this.isIntervalExpired &&
      !this.isNewTrack &&
      this.isTipsEnabled &&
      this.sessionStateStore.phoneHasNetwork
    );
  }

  get tipsSettingOn(): boolean {
    return Boolean(
      JSON.parse(this.persistentStorage.getItem(TIPS_ACTIVE_KEY) || 'true'),
    );
  }

  get isTipsEnabled(): boolean {
    return (
      this.tipsSettingOn &&
      !this.onboardingStore.isOnboardingOngoing
    );
  }

  triggerGetTipTimer(startup = false) {
    if (!this.fetchTipTimeoutId) {
      this.fetchTipTimeoutId = window.setTimeout(
        () => this.setIntervalExpired(true),
        startup ? TIPS_STARTUP_DELAY : TIPS_REQUEST_INTERVAL
      );
    }
  }

  private setNpvIdle(idle: boolean) {
    this.isNpvIdle = idle;
  }

  private setNewTrack(newTrack: boolean) {
    this.isNewTrack = newTrack;
  }

  private setIntervalExpired(expired: boolean) {
    this.isIntervalExpired = expired;
    window.clearTimeout(this.fetchTipTimeoutId);
    this.clearFetchTipTimeoutId();
  }

  public clearFetchTipTimeoutId() {
    this.fetchTipTimeoutId = undefined;
  }

  toggleTipsEnabled() {
    this.persistentStorage.setItem(
      TIPS_ACTIVE_KEY,
      String(!this.tipsSettingOn),
    );

    if (!this.tipsSettingOn) {
      this.tipsStore.clearTip();
    }
  }

  dismissVisibleTip() {
    if (this.tipToShow || this.hasBeenShown) {
      this.setIntervalExpired(false);
      window.clearTimeout(showTipTimeoutId);
      this.tipsStore.clearTip();
      this.setHasBeenShown(false);
      this.triggerGetTipTimer();
    }
  }

  setHasBeenShown(shown: boolean) {
    this.hasBeenShown = shown;
  }

  logTipClicked() {
    if (this.tipToShow) {
      this.npvUbiLogger.logTipDismissal(this.tipToShow.action);
    }
  }

  onShouldFetchTip(callback: () => void) {
    reaction(
      () => this.shouldFetchTip,
      () => {
        if (this.shouldFetchTip) {
          callback();
        }
      },
    );
  }

  onNpvIdleState() {
    reaction(
      () => this.viewStore.isNpv && !this.overlayController.anyOverlayIsShowing,
      (npvWithoutOverlay) => {
        if (npvWithoutOverlay) {
          this.triggerNpvIdleTimer();
        } else {
          this.setNpvIdle(false);
          window.clearTimeout(npvIdleTimeoutId);
        }
      },
    );
  }

  logTipImpression(action: string) {
    this.npvUbiLogger.logTipImpression(action);
  }
}

export default TipsUiState;

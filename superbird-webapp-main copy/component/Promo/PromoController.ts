import { RootStore } from 'store/RootStore';
import RemoteConfigStore from 'store/RemoteConfigStore';
import { makeAutoObservable, reaction } from 'mobx';
import MiddlewareActions from 'middleware/MiddlewareActions';
import SeedableStorageInterface from 'middleware/SeedableStorageInterface';
import SettingsStore from 'store/SettingsStore';
import ViewStore from 'store/ViewStore';
import { OverlayController } from 'component/Overlays/OverlayController';
import VoiceStore from 'store/VoiceStore';

export type PromoSeenHistory = Record<Promo, boolean>;
export type Promo = 'phone_calls' | 'other_media';
const PROMOS_ORDERED: Promo[] = ['phone_calls', 'other_media'];

export const PROMO_HISTORY_LOCAL_STORAGE_KEY = 'promo_history';

class PromoController {
  remoteConfigStore: RemoteConfigStore;
  overlayController: OverlayController;
  settingsStore: SettingsStore;
  voiceStore: VoiceStore;
  viewStore: ViewStore;
  middlewareActions: MiddlewareActions;
  persistentStorage: SeedableStorageInterface;

  userHasSeenPromoThisSession: boolean = false;
  micWasMutedWhenShowingPromo: boolean = false;

  constructor(
    {
      remoteConfigStore,
      settingsStore,
      voiceStore,
      viewStore,
      overlayController,
      persistentStorage,
    }: RootStore,
    middlewareActions: MiddlewareActions,
  ) {
    this.remoteConfigStore = remoteConfigStore;
    this.overlayController = overlayController;
    this.settingsStore = settingsStore;
    this.voiceStore = voiceStore;
    this.viewStore = viewStore;
    this.middlewareActions = middlewareActions;
    this.persistentStorage = persistentStorage;

    makeAutoObservable(this, {
      remoteConfigStore: false,
      overlayController: false,
      settingsStore: false,
      viewStore: false,
      middlewareActions: false,
    });

    this.onShouldShowPromoChanged(() => {
      if (this.shouldShowPromo) {
        this.overlayController.maybeShowAModal();
      } else if (this.overlayController.isShowing('promo')) {
        this.overlayController.resetAndMaybeShowAModal();
      }
    });
  }

  get promoHistory(): PromoSeenHistory {
    const storedValue = this.persistentStorage.getItem(
      PROMO_HISTORY_LOCAL_STORAGE_KEY,
    );

    if (!storedValue) {
      return {
        other_media: false,
        phone_calls: false,
      };
    }

    return JSON.parse(storedValue);
  }

  isEnabled(promo: Promo): boolean {
    const promoNameToEnabledState = {
      phone_calls: this.remoteConfigStore.handleIncomingPhoneCalls,
      other_media: this.remoteConfigStore.otherMediaEnabled,
    };
    return promoNameToEnabledState[promo] ?? true;
  }

  hasSeenPromo(promo: Promo): boolean {
    return this.promoHistory[promo];
  }

  get nextPromoToShow(): Promo | undefined {
    if (this.userHasSeenPromoThisSession) {
      return undefined;
    }

    return PROMOS_ORDERED.find(
      (promo) => this.isEnabled(promo) && !this.hasSeenPromo(promo),
    );
  }

  get shouldShowPromo(): boolean {
    return (
      !this.userHasSeenPromoThisSession &&
      this.nextPromoToShow !== undefined &&
      this.viewStore.isMain
    );
  }

  handlePromoSeen(promo: Promo): void {
    const new_history = this.promoHistory;
    new_history[promo] = true;
    this.persistentStorage.setItem(
      PROMO_HISTORY_LOCAL_STORAGE_KEY,
      JSON.stringify(new_history),
    );

    this.userHasSeenPromoThisSession = true;
  }

  handlePromoConfirmationSelected(promo: Promo): void {
    this.handlePromoSeen(promo);
  }

  handlePromoOptionSelected(promo: Promo): void {
    this.handlePromoSeen(promo);

    if (promo === 'phone_calls') {
      this.overlayController.showSettings();
      this.settingsStore.showPhoneCalls();
    }
  }

  handlePromoShowing(): void {
    this.micWasMutedWhenShowingPromo = this.voiceStore.isMicMuted;
    if (this.micWasMutedWhenShowingPromo) {
      // If the mic is already muted, there's no need to mute
      return;
    }
    this.middlewareActions.voiceMute(true, false);
  }

  handlePromoDisappearing(): void {
    if (this.micWasMutedWhenShowingPromo) {
      // If the mic was previously muted by the user, don't unmute
      return;
    }
    this.middlewareActions.voiceMute(false, false);
  }

  onShouldShowPromoChanged(callback: () => void): void {
    reaction(
      () => this.shouldShowPromo,
      () => {
        callback();
      },
    );
  }
}

export default PromoController;

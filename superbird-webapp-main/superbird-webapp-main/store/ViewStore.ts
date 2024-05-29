import { makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';
import {
  ContextItem,
  isSupportedUriType,
} from 'component/Tracklist/TracklistUiState';
import { transitionDurationMs } from 'style/Variables';
import { isStationURI } from '@spotify-internal/uri';

export enum AppView {
  LOGO,
  SETUP,
  OTA,
  MAIN,
  ONBOARDING,
  NOTHING, // before we have info needed to decide what to show.
}

export enum View {
  CONTENT_SHELF = 'shelf',
  TRACKLIST = 'tracklist',
  QUEUE = 'queue',
  NPV = 'npv',
}

type OriginEntryState = {
  type: 'origin';
  value: 'preset' | 'current_context';
};

type ContextItemState = {
  type: 'context_item';
  value: ContextItem;
};

type ViewStackItemState = OriginEntryState | ContextItemState;

type ViewStackItem = {
  view: View;
  state?: ViewStackItemState;
};

const INITIAL_VIEW_STACK: ViewStackItem[] = [
  { view: View.CONTENT_SHELF },
  { view: View.NPV },
];

export const DEFAULT_TIMEOUT_TO_NPV = 30000;

class ViewStore {
  viewStack: ViewStackItem[] = INITIAL_VIEW_STACK;
  rootStore: RootStore;
  timeoutId?: number = undefined;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      timeoutId: false,
      maybeDoBackSideEffect: false,
    });

    this.rootStore = rootStore;
    this.resetNpvTimeout();
  }

  get currentViewStackItem(): ViewStackItem {
    const viewEntry = this.viewStack.slice(-1).pop();
    if (!viewEntry) {
      throw new Error('viewstack was empty. should never happen');
    }
    return viewEntry;
  }

  get currentView(): View {
    return this.currentViewStackItem.view;
  }

  get viewUnderCurrentView(): View | undefined {
    if (this.viewStack.length <= 1) {
      return undefined;
    }
    return this.viewStack[this.viewStack.length - 2].view;
  }

  get isContentShelf() {
    return this.currentView === View.CONTENT_SHELF;
  }

  get isTracklist() {
    return this.currentView === View.TRACKLIST;
  }

  get isQueue() {
    return this.currentView === View.QUEUE;
  }

  get isNpv() {
    return this.currentView === View.NPV;
  }

  get appView(): AppView {
    const {
      setupStore,
      onboardingStore,
      hardwareStore,
      otaStore,
      persistentStorage,
    } = this.rootStore;
    if (
      !setupStore.hasStatusMessage ||
      !onboardingStore.onboardingMsgReceived ||
      !persistentStorage.seeded
    ) {
      return AppView.NOTHING;
    }

    if (hardwareStore.rebooting) {
      return AppView.LOGO;
    } else if (setupStore.shouldShowSetup) {
      return AppView.SETUP;
    } else if (otaStore.criticalUpdate && !otaStore.updateSuccess) {
      return AppView.OTA;
    } else if (onboardingStore.shouldShowOnboarding) {
      return AppView.ONBOARDING;
    }

    return AppView.MAIN;
  }

  get isMain() {
    return this.appView === AppView.MAIN;
  }

  get isSetup() {
    return this.appView === AppView.SETUP;
  }

  get isOnboarding() {
    return this.appView === AppView.ONBOARDING;
  }

  /*
   *   if calling showView when currently on that view, nothing will be added.
   *   if calling showView when currently on that view with a state, that state will be added to the current view.
   * */
  showView(view: View, state?: ViewStackItemState) {
    if (this.currentView === view) {
      if (state) {
        this.viewStack.pop();
        this.viewStack.push({ view, state });
      }
    } else {
      this.viewStack.push({ view, state });
    }
  }

  showContentShelf(state?: ViewStackItemState) {
    this.resetNpvTimeout();
    this.showView(View.CONTENT_SHELF, state);
  }

  showTracklist(state?: ViewStackItemState) {
    this.resetNpvTimeout();
    this.showView(View.TRACKLIST, state);
  }

  showQueue(state?: ViewStackItemState) {
    this.resetNpvTimeout();
    if (this.isNpv && this.viewUnderCurrentView === View.QUEUE) {
      this.back();
    } else {
      this.showView(View.QUEUE, state);
    }
  }

  showNpv(state?: ViewStackItemState) {
    if (
      this.isTracklist &&
      this.viewUnderCurrentView === View.NPV &&
      this.currentViewStackItem.state?.type === 'origin' &&
      this.currentViewStackItem.state?.value === 'current_context'
    ) {
      this.back();
    } else {
      this.showView(View.NPV, state);
    }
  }

  backToContentShelf(backToNpvDelayMs?: number): void {
    this.resetNpvTimeout(backToNpvDelayMs);
    if (this.isContentShelf) {
      return;
    }
    this.viewStack = [{ view: View.CONTENT_SHELF }];
  }

  backSkippingQueue() {
    const listIndex = this.viewStack.findIndex(
      (viewStackItem) => viewStackItem.view === View.QUEUE,
    );
    this.viewStack.splice(listIndex);
  }

  showCurrentContextInTracklist() {
    const { tracklistStore, playerStore, shelfStore } = this.rootStore;
    tracklistStore.tracklistUiState.loadCurrentContext();
    if (isSupportedUriType(playerStore.contextUri)) {
      switch (this.currentView) {
        case View.TRACKLIST:
          shelfStore.shelfController.goBackToHome();
          break;
        case View.CONTENT_SHELF:
          this.showTracklist();
          setTimeout(
            () => shelfStore.shelfController.goBackToHome(),
            transitionDurationMs,
          );
          break;
        case View.NPV:
          this.showTracklist({ type: 'origin', value: 'current_context' });
          break;
        default:
          break;
      }
    }
  }

  resetNpvTimeout(time: number = DEFAULT_TIMEOUT_TO_NPV) {
    if (this.appView === AppView.ONBOARDING) {
      window.clearTimeout(this.timeoutId);
    } else {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = window.setTimeout(() => {
        this.showNpv();
      }, time);
    }
  }

  maybeDoBackSideEffect(popedViewStackItem?: ViewStackItem) {
    const { tracklistStore } = this.rootStore;
    if (
      popedViewStackItem?.view === View.NPV &&
      this.currentView === View.TRACKLIST &&
      popedViewStackItem?.state?.type === 'origin' &&
      popedViewStackItem?.state?.value === 'preset'
    ) {
      this.rootStore.tracklistStore.tracklistUiState.initializeTracklist(
        this.rootStore.playerStore.currentContextItem,
      );
    } else if (
      popedViewStackItem?.view === View.TRACKLIST &&
      this.currentView === View.NPV &&
      this.viewUnderCurrentView === View.QUEUE
    ) {
      this.backSkippingQueue();
    } else if (
      this.isTracklist &&
      this.currentViewStackItem.state?.type === 'context_item' &&
      this.currentViewStackItem.state.value.uri !==
        tracklistStore.tracklistUiState.contextUri
    ) {
      tracklistStore.tracklistUiState.handleSupportedTracklists(
        this.currentViewStackItem.state.value,
      );
    } else if (this.isTracklist) {
      tracklistStore.tracklistUiState.setAnimateSliding(false);
      if (isStationURI(tracklistStore.tracklistUiState.contextUri)) {
        tracklistStore.tracklistUiState.updateSelectedItem(
          tracklistStore.tracklistUiState.currentlyPlayingTrackOrFirst,
          false,
        );
      }
    }
  }

  back() {
    if (this.viewStack.length > 1) {
      this.resetNpvTimeout();
      this.maybeDoBackSideEffect(this.viewStack.pop());
    } else {
      this.showNpv();
    }
  }

  reset() {
    this.viewStack = INITIAL_VIEW_STACK;
  }
}

export default ViewStore;

import { action as mobxAction, makeAutoObservable } from 'mobx';
import {
  ADD_TO_COLLECTION_INTENT,
  ADD_TO_QUEUE_INTENT,
  CANCEL_INTERACTION_INTENT,
  NO_CONFIRMATION_INTENTS,
  NO_INTENT,
  PLAY_INTENT,
  PLAY_PRESET_INTENT,
  SAVE_TO_PRESET_INTENT,
  SEARCH_RESULT_INTENTS,
  SHOW_INTENT,
  VOICE_CONFIRMATION_INTENTS,
  VOICE_CONFIRMATION_INTENTS_WITH_ICON,
} from 'component/VoiceConfirmation/VoiceConfirmationIntents';
import Socket from '../Socket';
import MiddlewareActions from 'middleware/MiddlewareActions';
import { parseCategoryId } from 'helpers/contentIdExtractor';
import { RootStore } from './RootStore';
import { AppView, DEFAULT_TIMEOUT_TO_NPV } from './ViewStore';
import { VOICE_IDENTIFIER } from './ShelfStore';
import {
  FEATURE_IDENTIFIER_SHOW_ME,
  FEATURE_IDENTIFIER_VOICE,
  setTrackViewFeatureIdentifier,
} from 'helpers/FeatureIdentifiers';
import { isSupportedUriType } from 'component/Tracklist/TracklistUiState';
import {
  isValidPresetNumber,
  parsePresetNumber,
  PresetNumber,
} from './PresetsDataStore';
import { OVERLAY_TRANSITION_DURATION_MS } from 'component/Overlays/Overlay';
import {
  AsrMessage,
  IntermediateResultMessage,
  LocalCommand,
  MicrophoneLevelMessage,
  MuteMessage,
  NluMessage,
  VoiceItem,
  VoiceMessage,
} from 'types/messages';
import {
  PLAY_PODCAST_ACTION,
  PLAY_SPOTIFY_ACTION,
  SAVE_TO_COLLECTION_ACTION,
  SAVE_TO_COLLECTION_PODCAST_ACTION,
  SHOW_MY_EPISODES_ACTION,
  SHOW_MY_LIBRARY_ACTION,
  SHOW_MY_NEW_EPISODES_ACTION,
  SHOW_MY_PRESETS_ACTION,
  SHOW_MY_SONGS_ACTION,
  SHOW_PODCAST_ACTION,
  SHOW_THE_QUEUE_ACTION,
  SHOW_THIS_ARTIST_ACTION,
  SHOW_TRACKS_ACTION,
} from 'component/VoiceConfirmation/VoiceConfirmationActions';

export enum UiAction {
  SAVE_TO_PRESET,
  PLAY_PRESET,
  SHOW_SEARCH_RESULT,
  SHOW_CONFIRMATION,
  ADD_TO_QUEUE,
  SHOW_TRACKLIST,
  NO_CONFIRMATION,
  GO_TO_CONTENT,
  GO_TO_LIBRARY,
  GO_TO_QUEUE,
  GO_TO_PRESETS,
  GO_TO_TRACKLIST_CURRENT_CONTEXT,
  ERROR_RESULT,
  CANCEL_VOICE,
  UNKNOWN,
  SAVE_PODCAST,
}

const MINIMUM_THINKING_TIME_FOR_SEARCH_RESULT = 2_000;
const PLAY_TIMEOUT_TO_NPV = 10_000;
const RESPONSE_TIMEOUT = 15_000;
export const TIMEOUT_BEFORE_CLOSING_LISTENING_MS = 7500;
export const TRANSCRIPT_DELAY_DURATION_MS = 1000;
export const VOICE_CONFIRMATION_DURATION_MS = 1000;
export const ADD_TO_QUEUE_CONFIRMATION_DURATION_MS = 8000;

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Tap to try again.';
const TIMEOUT_ERROR_MESSAGE =
  'I didn’t understand what you said. Tap to try again.';

type VoiceState = {
  session_id: string;
  asr: AsrMessage;
  nlu: NluMessage;
  microphoneLevel: number;
  error?: string;
  friendlyError: string;
  micPan: number;
  confirmationText?: {
    title: string;
    subtitle: string;
  };
};

type VoiceStoreMiscState = {
  isMicMuted: boolean;
  voiceShelf: {
    transcript: string;
    items: unknown[];
  };
  volume: number;
  micPan: number;
  microphone_volume: number;
};

type VoiceStoreState = VoiceState & VoiceStoreMiscState;

const getInitialVoiceSessionState = (): VoiceState => {
  return {
    session_id: '',
    asr: {
      transcript: '',
      isEndOfSpeech: false,
      isFinal: false,
    },
    nlu: {
      custom: {
        intent: '',
        content_id: '',
        go_to_content_id: '',
        error: '',
        errorUi: {
          titleText: '',
          subtitleText: '',
        },
        slots: {
          preset: [],
        },
        query: '',
        ttsPrompt: '',
        ttsUrl: '',
        action: '',
        connect_action_taken: false,
      },
      body: [],
    },
    microphoneLevel: 0,
    error: '',
    friendlyError: '',
    micPan: 0,
    confirmationText: undefined,
  };
};

const getInitialState = (): VoiceStoreState => {
  return {
    ...getInitialVoiceSessionState(),
    isMicMuted: false,
    voiceShelf: {
      transcript: '',
      items: [],
    },
    volume: 0,
    micPan: 0,
    microphone_volume: 0,
  };
};

class VoiceStore {
  state: VoiceStoreState = getInitialState();
  showingVoiceConfirmation = false;

  rootStore: RootStore;
  middlewareActions: MiddlewareActions;

  closeTimeoutId?: number;
  thinkingTimeoutId?: number;
  responseTimeoutId?: number;
  micLevelMovingAverage: number = 0;
  microphoneLevelsSlidingWindow: number[] = [];

  constructor(
    rootStore: RootStore,
    socket: Socket,
    middlewareActions: MiddlewareActions,
  ) {
    makeAutoObservable(this, {
      rootStore: false,
      middlewareActions: false,
      closeTimeoutId: false,
      thinkingTimeoutId: false,
      responseTimeoutId: false,
      micLevelMovingAverage: false,
      microphoneLevelsSlidingWindow: false,
    });

    this.rootStore = rootStore;
    this.middlewareActions = middlewareActions;
    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
  }

  onMiddlewareEvent(msg: VoiceMessage): void {
    switch (msg.type) {
      case 'voice_wakeword':
        this.onWakeWord();
        break;
      case 'voice_error':
        if (msg.payload.domain === 'OFFLINE') {
          this.onError(
            'offline',
            'Looks like you’re offline.\nMake sure cellular data is turned on.',
          );
        } else {
          this.onError(msg.payload.domain);
        }
        break;
      case 'voice_timeout':
        this.onError('timeout', TIMEOUT_ERROR_MESSAGE);
        break;
      case 'voice_local_command':
        this.onLocalCommand(msg.command);
        break;
      case 'voice_intermediate_result':
        this.onIntermediateResult(msg);
        break;
      case 'voice_intent':
        if (this.rootStore.viewStore.isOnboarding) {
          this.onOnboardingVoiceIntent(msg.payload.nlu);
        } else {
          this.onVoiceIntent(msg.payload.nlu);
        }
        break;
      case 'voice_mute':
        this.onMute(msg);
        break;
      case 'voice_microphone_level':
        this.onMicrophoneLevel(msg);
        break;
      default:
        // no-op. Unknown message.
        break;
    }
  }

  onWakeWord(): void {
    const { viewStore, overlayController, onboardingStore } = this.rootStore;

    switch (viewStore.appView) {
      case AppView.MAIN:
        window.clearTimeout(this.closeTimeoutId);
        viewStore.resetNpvTimeout();
        this.rootStore.npvStore.tipsUiState.dismissVisibleTip();
        overlayController.showVoice();
        break;
      case AppView.ONBOARDING:
        onboardingStore.setWakewordTriggered(true);
        break;
      default:
        break;
    }
    this.clearThinkingTimeout();
    this.resetVoiceSessionState();
    this.maybeShowErrorAfterTimeout();
  }

  onError(error = 'unset-error', friendlyError = DEFAULT_ERROR_MESSAGE): void {
    this.clearResponseTimeout();
    this.state.error = error;
    this.state.friendlyError = friendlyError;
    this.closeListeningAfterTimeout();
  }

  maybeShowErrorAfterTimeout(friendlyError = DEFAULT_ERROR_MESSAGE): void {
    this.responseTimeoutId = window.setTimeout(
      mobxAction(() => {
        if (!this.state.nlu.custom.intent) {
          this.middlewareActions.voiceCancel();
          this.state.error = 'timeout';
          this.state.friendlyError = friendlyError;
        }
      }),
      RESPONSE_TIMEOUT,
    );
  }

  handleLocalCommandAsVoiceIntent(transcript: string, intent: string): void {
    this.state.asr = {
      transcript,
      isFinal: true,
      isEndOfSpeech: true,
    };

    const nluMessage = {
      body: [],
      custom: {
        intent,
        connect_action_taken: false,
        ttsPrompt: '',
        ttsUrl: '',
        query: '',
      },
    };

    if (this.rootStore.viewStore.isOnboarding) {
      this.onOnboardingVoiceIntent(nluMessage);
    } else {
      this.onVoiceIntent(nluMessage);
    }
  }

  onLocalCommand(command: LocalCommand): void {
    const { overlayController } = this.rootStore;
    this.clearResponseTimeout();

    switch (command) {
      case LocalCommand.PLAY:
        this.handleLocalCommandAsVoiceIntent('Play', LocalCommand.PLAY);
        break;
      case LocalCommand.STOP:
        this.handleLocalCommandAsVoiceIntent('Stop', LocalCommand.STOP);
        break;
      case LocalCommand.RESUME:
        this.handleLocalCommandAsVoiceIntent('Resume', LocalCommand.RESUME);
        break;
      case LocalCommand.PREVIOUS:
        this.handleLocalCommandAsVoiceIntent('Previous', LocalCommand.PREVIOUS);
        break;
      case LocalCommand.NEXT:
        this.handleLocalCommandAsVoiceIntent('Next song', LocalCommand.NEXT);
        break;
      case LocalCommand.MUTE:
        this.handleLocalCommandAsVoiceIntent('Mute', LocalCommand.MUTE);
        break;
      default:
        overlayController.resetAndMaybeShowAModal();
        break;
    }
  }

  onIntermediateResult(msg: IntermediateResultMessage): void {
    this.state = { ...this.state, ...msg.payload };
  }

  onMute(msg: MuteMessage): void {
    this.state.isMicMuted = !!msg.payload;
  }

  onMicrophoneLevel(msg: MicrophoneLevelMessage): void {
    this.state.microphoneLevel = parseFloat(msg.level); // TODO: remove when JellyfishLegacy is removed
    this.microphoneLevelsSlidingWindow.push(parseFloat(msg.level)); // TODO: needs tuning

    if (this.microphoneLevelsSlidingWindow.length >= 100) {
      this.microphoneLevelsSlidingWindow.shift();
    }

    if (this.microphoneLevelsSlidingWindow.length) {
      this.micLevelMovingAverage =
        this.microphoneLevelsSlidingWindow.reduce((sum, v) => sum + v, 0) /
        this.microphoneLevelsSlidingWindow.length;
    }
  }

  get microphoneLevel(): number {
    return this.state.microphoneLevel;
  }

  get isMicMuted(): boolean {
    return this.state.isMicMuted;
  }

  closeVoiceOverlayAndDoEffectAfterTimeout(
    effect: () => void,
    timeout: number,
  ): void {
    const { overlayController } = this.rootStore;
    window.clearTimeout(this.thinkingTimeoutId);
    this.thinkingTimeoutId = window.setTimeout(() => {
      effect();
      overlayController.resetAndMaybeShowAModal();
    }, timeout);
  }

  showQueueConfirmation(item: VoiceItem): void {
    this.state.confirmationText = {
      title: `Added to queue:`,
      subtitle: `${item.text.title} - ${item.text.subtitle}`,
    };
    this.closeVoiceOverlayAndDoEffectAfterTimeout(() => {
      this.resetVoiceSessionState();
    }, ADD_TO_QUEUE_CONFIRMATION_DURATION_MS);
  }

  showVoiceConfirmation(): void {
    // Delay before showing the confirmation, so we can show the user the transcript first.
    this.closeTimeoutId = window.setTimeout(
      mobxAction(() => {
        if (VOICE_CONFIRMATION_INTENTS_WITH_ICON.includes(this.intent)) {
          this.showingVoiceConfirmation = true;
        }
        this.closeVoiceOverlayAndDoEffectAfterTimeout(() => {
          setTimeout(
            () => this.resetVoiceSessionState(),
            OVERLAY_TRANSITION_DURATION_MS,
          );
        }, VOICE_CONFIRMATION_DURATION_MS);
      }),
      TRANSCRIPT_DELAY_DURATION_MS,
    );
  }

  goToContentShelfCategory(goToContentId: string) {
    const { shelfStore, viewStore } = this.rootStore;
    this.closeVoiceOverlayAndDoEffectAfterTimeout(async () => {
      await shelfStore.getShelfData();
      shelfStore.shelfController.handleShelfTitleSelected(
        parseCategoryId(goToContentId),
      );
      shelfStore.shelfController.openCategory(parseCategoryId(goToContentId));
      viewStore.backToContentShelf(DEFAULT_TIMEOUT_TO_NPV);
    }, 1000);
  }

  goToVoiceResult(voiceIntent: string, contentId: string) {
    const { shelfStore, viewStore } = this.rootStore;
    shelfStore.getShelfData();
    const timeToNpv =
      voiceIntent === SHOW_INTENT
        ? DEFAULT_TIMEOUT_TO_NPV
        : PLAY_TIMEOUT_TO_NPV;
    shelfStore.shelfController.collapseAllCategories();
    shelfStore.shelfController.openCategory(contentId);
    shelfStore.shelfController.updateToFirstItemOfCategory(contentId);
    this.closeVoiceOverlayAndDoEffectAfterTimeout(() => {
      viewStore.backToContentShelf(
        timeToNpv + MINIMUM_THINKING_TIME_FOR_SEARCH_RESULT,
      );
    }, MINIMUM_THINKING_TIME_FOR_SEARCH_RESULT);
  }

  playPreset(presetNumber: PresetNumber) {
    const { presetsController, viewStore } = this.rootStore;
    this.closeVoiceOverlayAndDoEffectAfterTimeout(() => {
      presetsController.presetsUiState.playPresetOrTts(presetNumber);
      viewStore.showNpv();
    }, MINIMUM_THINKING_TIME_FOR_SEARCH_RESULT);
  }

  onOnboardingVoiceIntent(nluMessage: NluMessage): void {
    this.clearResponseTimeout();
    this.state.nlu = nluMessage;
    const voiceIntentAction = this.intendedAction(nluMessage);
    if (voiceIntentAction === UiAction.ERROR_RESULT) {
      this.onError(nluMessage.custom.error);
    }
  }

  handleShowTracklistUiAction(nluMessage: NluMessage) {
    const { tracklistStore, errorHandler, viewStore, shelfStore } =
      this.rootStore;
    const { content_id: contentId } = nluMessage.custom;

    if (nluMessage.body?.length) {
      const contextItem = nluMessage.body[0];
      tracklistStore.tracklistUiState.initializeTracklist({
        uri: contextItem.target.uri,
        title: contextItem.text.title,
        image_id: contextItem.images?.main.uri,
      });
    }
    if (contentId) {
      shelfStore.populateVoice({
        items: nluMessage.body || [],
        id: parseCategoryId(contentId),
      });
    } else {
      errorHandler.logUnexpectedError(
        new Error('Should show search result but received no content_id'),
      );
    }

    this.closeVoiceOverlayAndDoEffectAfterTimeout(() => {
      viewStore.backToContentShelf();
      viewStore.showTracklist();
    }, MINIMUM_THINKING_TIME_FOR_SEARCH_RESULT);
  }

  handleGotoPresetsAction(): void {
    const { overlayController, presetsController } = this.rootStore;

    overlayController.resetAndMaybeShowAModal();
    presetsController.presetsUiState.highlightPreset();
    overlayController.showPresets();
  }

  handleGoToQueueAction(): void {
    const {
      queueStore: { queueUiState },
      overlayController,
    } = this.rootStore;
    queueUiState.displayQueue();
    overlayController.resetAndMaybeShowAModal();
  }

  onVoiceIntent(nluMessage: NluMessage): void {
    this.clearResponseTimeout();
    const {
      shelfStore,
      overlayController,
      presetsController,
      presetsDataStore,
      errorHandler,
      viewStore,
      playerStore,
      savedStore,
    } = this.rootStore;
    const {
      intent,
      action: actionIntent,
      content_id: contentId,
      go_to_content_id: goToContentId,
      slots,
    } = nluMessage.custom;
    this.state.nlu = nluMessage;
    const voiceIntentAction = this.intendedAction(nluMessage);

    switch (voiceIntentAction) {
      case UiAction.SAVE_PODCAST:
        savedStore.setSavedLocal(playerStore.contextUri, true);
        this.showVoiceConfirmation();
        break;
      case UiAction.SHOW_TRACKLIST:
        setTrackViewFeatureIdentifier(
          actionIntent === PLAY_PODCAST_ACTION
            ? FEATURE_IDENTIFIER_VOICE
            : FEATURE_IDENTIFIER_SHOW_ME,
        );
        this.handleShowTracklistUiAction(nluMessage);
        break;
      case UiAction.SHOW_SEARCH_RESULT:
        if (contentId) {
          shelfStore.populateVoice({
            items: nluMessage.body || [],
            id: parseCategoryId(contentId),
          });
          this.goToVoiceResult(intent, parseCategoryId(contentId));
        } else {
          errorHandler.logUnexpectedError(
            new Error('Should show search result but received no content_id'),
          );
        }
        break;
      case UiAction.GO_TO_CONTENT:
        if (
          goToContentId &&
          shelfStore.shelfController.getCategoryFromId(
            parseCategoryId(goToContentId),
          )
        ) {
          this.goToContentShelfCategory(goToContentId);
        } else {
          errorHandler.logUnexpectedError(
            new Error(
              `Should go to specific category but no matching shelf category found: ${goToContentId}`,
            ),
          );
        }
        break;
      case UiAction.GO_TO_LIBRARY:
        if (shelfStore.shelfController.firstLibraryCategoryId) {
          this.goToContentShelfCategory(
            shelfStore.shelfController.firstLibraryCategoryId,
          );
        }
        break;
      case UiAction.GO_TO_PRESETS:
        this.handleGotoPresetsAction();
        break;
      case UiAction.GO_TO_TRACKLIST_CURRENT_CONTEXT:
        this.closeVoiceOverlayAndDoEffectAfterTimeout(() => {
          viewStore.showCurrentContextInTracklist();
        }, 1500);
        break;
      case UiAction.ADD_TO_QUEUE:
        if (!nluMessage.body || !nluMessage.body[0]) {
          // We don't know what to show.
          return;
        }
        playerStore.interappActions.queueUri(nluMessage.body[0].target.uri);
        this.showQueueConfirmation(nluMessage.body[0]);
        break;
      case UiAction.GO_TO_QUEUE:
        this.handleGoToQueueAction();
        break;
      case UiAction.SHOW_CONFIRMATION:
        this.showVoiceConfirmation();
        break;
      case UiAction.SAVE_TO_PRESET:
        if (slots?.preset?.length && isValidPresetNumber(slots.preset[0])) {
          presetsController.presetsUiState.setTempPreset(
            parsePresetNumber(slots.preset[0]),
          );
          presetsDataStore.savePreset(
            playerStore.contextUri,
            parsePresetNumber(slots.preset[0]),
            'voice',
          );
          this.showVoiceConfirmation();
        } else {
          if (presetsDataStore.emptyPresetNumbers.length === 0) {
            presetsController.presetsUiState.playTts('preset_say_a_number.mp3');
            overlayController.resetAndMaybeShowAModal();
          } else if (presetsDataStore.emptyPresetNumbers.length === 1) {
            presetsController.presetsUiState.setTempPreset(
              presetsDataStore.emptyPresetNumbers[0],
            );
            presetsDataStore.savePreset(
              playerStore.contextUri,
              presetsDataStore.emptyPresetNumbers[0],
              'voice',
            );
            this.showVoiceConfirmation();
          }
        }
        break;
      case UiAction.PLAY_PRESET:
        if (slots?.preset?.length) {
          this.playPreset(parsePresetNumber(slots.preset[0]));
        }
        break;
      case UiAction.ERROR_RESULT:
        this.onError(nluMessage.custom.error || 'Sorry!');
        break;
      case UiAction.NO_CONFIRMATION:
        overlayController.resetAndMaybeShowAModal();
        break;
      case UiAction.CANCEL_VOICE:
        this.cancel();
        break;
      case UiAction.UNKNOWN:
        errorHandler.logUnexpectedError(
          new Error(`Unknown voice intent: ${intent} Action: ${actionIntent}`),
        );
        overlayController.resetAndMaybeShowAModal();
        break;
      default:
        this.onError(nluMessage.custom.error);
        errorHandler.logUnexpectedError(
          new Error(
            `No confirmation, no alternative search results, no error. Intent: ${intent} Action: ${actionIntent}`,
          ),
        );
        overlayController.resetAndMaybeShowAModal();
        break;
    }
  }

  closeListeningAfterTimeout(): void {
    if (!this.rootStore.viewStore.isOnboarding) {
      window.clearTimeout(this.closeTimeoutId);
      this.closeTimeoutId = window.setTimeout(
        () => this.cancel(),
        TIMEOUT_BEFORE_CLOSING_LISTENING_MS,
      );
    }
  }

  clearResponseTimeout() {
    window.clearTimeout(this.responseTimeoutId);
  }

  clearThinkingTimeout() {
    window.clearTimeout(this.thinkingTimeoutId);
  }

  cancel(): void {
    const { overlayController } = this.rootStore;
    this.middlewareActions.voiceCancel();
    overlayController.resetAndMaybeShowAModal();
    window.setTimeout(() => {
      this.resetVoiceSessionState();
    }, OVERLAY_TRANSITION_DURATION_MS);

    window.clearTimeout(this.thinkingTimeoutId);
    window.clearTimeout(this.closeTimeoutId);
  }

  resetVoiceSessionState(): void {
    this.state = { ...this.state, ...getInitialVoiceSessionState() };
    this.showingVoiceConfirmation = false;
    this.microphoneLevelsSlidingWindow = [];
    this.micLevelMovingAverage = 0;
  }

  get error(): string | undefined {
    return this.state.error;
  }

  shouldShowTracklist(nluMessage: NluMessage): boolean {
    const { intent, action, error } = nluMessage.custom;
    if (error || !intent || !action || !nluMessage.body?.length) {
      return false;
    }

    return (
      (intent === SHOW_INTENT || intent === PLAY_INTENT) &&
      [
        'SHOW_THIS_',
        SHOW_MY_NEW_EPISODES_ACTION,
        SHOW_MY_EPISODES_ACTION,
        SHOW_PODCAST_ACTION,
        PLAY_PODCAST_ACTION,
        SHOW_MY_SONGS_ACTION,
      ].some((item) => action.includes(item)) &&
      action !== SHOW_THIS_ARTIST_ACTION &&
      isSupportedUriType(nluMessage.body[0].target.uri)
    );
  }

  intendedAction(voiceMessage: NluMessage): UiAction {
    const { errorHandler, playerStore } = this.rootStore;
    const {
      intent,
      action,
      go_to_content_id: goToContentId,
      error,
      slots,
    } = voiceMessage.custom;

    if (
      action?.startsWith('SHOW_MY_') &&
      goToContentId &&
      !goToContentId.includes(VOICE_IDENTIFIER)
    ) {
      return UiAction.GO_TO_CONTENT;
    } else if (
      action?.startsWith('SHOW_MY_') &&
      goToContentId?.includes(VOICE_IDENTIFIER)
    ) {
      return UiAction.SHOW_SEARCH_RESULT;
    } else if (intent === SHOW_INTENT && action === SHOW_MY_LIBRARY_ACTION) {
      return UiAction.GO_TO_LIBRARY;
    } else if (
      intent === ADD_TO_COLLECTION_INTENT &&
      action &&
      [SAVE_TO_COLLECTION_ACTION, SAVE_TO_COLLECTION_PODCAST_ACTION].includes(
        action,
      ) &&
      playerStore.isPodcast
    ) {
      return UiAction.SAVE_PODCAST;
    } else if (intent === SHOW_INTENT && action === SHOW_MY_PRESETS_ACTION) {
      return UiAction.GO_TO_PRESETS;
    } else if (intent === SHOW_INTENT && action === SHOW_THE_QUEUE_ACTION) {
      return UiAction.GO_TO_QUEUE;
    } else if (intent === SHOW_INTENT && action === SHOW_TRACKS_ACTION) {
      return UiAction.GO_TO_TRACKLIST_CURRENT_CONTEXT;
    } else if (
      NO_CONFIRMATION_INTENTS.includes(intent) ||
      action === PLAY_SPOTIFY_ACTION
    ) {
      return UiAction.NO_CONFIRMATION;
    } else if (intent === CANCEL_INTERACTION_INTENT) {
      return UiAction.CANCEL_VOICE;
    } else if (error) {
      // items above can come with error but we accept them as ok
      return UiAction.ERROR_RESULT;
    } else if (this.shouldShowTracklist(voiceMessage)) {
      return UiAction.SHOW_TRACKLIST;
    } else if (
      SEARCH_RESULT_INTENTS.includes(intent) &&
      !error &&
      !goToContentId &&
      voiceMessage.body?.length
    ) {
      return UiAction.SHOW_SEARCH_RESULT;
    } else if (!error && intent === SAVE_TO_PRESET_INTENT) {
      return UiAction.SAVE_TO_PRESET;
    } else if (
      !error &&
      intent === PLAY_PRESET_INTENT &&
      slots?.preset?.length &&
      isValidPresetNumber(slots.preset[0])
    ) {
      return UiAction.PLAY_PRESET;
    } else if (intent === ADD_TO_QUEUE_INTENT) {
      if (!voiceMessage.body || !voiceMessage.body[0]) {
        return UiAction.ERROR_RESULT;
      }
      return UiAction.ADD_TO_QUEUE;
    } else if (VOICE_CONFIRMATION_INTENTS.includes(intent) && !error) {
      return UiAction.SHOW_CONFIRMATION;
    } else if (
      intent === NO_INTENT &&
      !voiceMessage.body?.length &&
      !goToContentId
    ) {
      return UiAction.ERROR_RESULT;
    } else if (
      SEARCH_RESULT_INTENTS.includes(intent) &&
      voiceMessage.body?.length === 0
    ) {
      errorHandler.logUnexpectedError(
        new Error(`Voice result intent without items: ${intent}`),
      );
      return UiAction.NO_CONFIRMATION;
    }

    return UiAction.UNKNOWN;
  }

  get friendlyError(): string {
    return this.state.friendlyError || '';
  }

  get errorUiTitle(): string | undefined {
    return this.state.nlu.custom.errorUi?.titleText;
  }

  get errorUiSubtitle(): string | undefined {
    return this.state.nlu.custom.errorUi?.subtitleText;
  }

  get isError(): boolean {
    return !!(this.error || this.errorUiTitle || this.friendlyError);
  }

  get listening(): boolean {
    return !this.state.asr.isFinal && !this.state.error;
  }

  get thinking(): boolean {
    return this.state.asr.isFinal;
  }

  get intent(): string {
    return this.state.nlu.custom.intent;
  }

  retry(): void {
    const { viewStore } = this.rootStore;
    viewStore.resetNpvTimeout();
    this.reset();
    this.maybeShowErrorAfterTimeout();
    this.middlewareActions.voiceStart();
  }

  handleManualVoiceSessionStart() {
    const { overlayController } = this.rootStore;
    overlayController.showVoice();
    this.retry();
    this.clearThinkingTimeout();
    this.resetVoiceSessionState();
    this.maybeShowErrorAfterTimeout();
  }

  reset(): void {
    window.clearTimeout(this.closeTimeoutId);
    this.state = getInitialState();
  }

  toggleMic(): void {
    this.state.isMicMuted = !this.isMicMuted;
    this.middlewareActions.voiceMute(this.isMicMuted);
  }
}

export default VoiceStore;

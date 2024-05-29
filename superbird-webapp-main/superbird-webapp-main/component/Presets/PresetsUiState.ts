import PresetsDataStore, {
  Preset,
  PRESET_NUMBERS,
  PresetNumber,
} from 'store/PresetsDataStore';
import PresetsUbiLogger from 'eventhandler/PresetsUbiLogger';
import { makeAutoObservable } from 'mobx';
import { isPlaylistRecommendedUri } from 'helpers/SpotifyUriUtil';
import { titleBasedOnType } from 'helpers/ContextTitleExtractor';
import PlayerStore from 'store/PlayerStore';
import ShelfStore from 'store/ShelfStore';
import QueueStore from 'store/QueueStore';
import InterappActions from 'middleware/InterappActions';
import ViewStore from 'store/ViewStore';
import NpvStore from 'store/NpvStore';
import { OverlayController } from 'component/Overlays/OverlayController';

export const FEATURE_IDENTIFIER_PRESETS = 'car-thing-preset';
export const PRESET_SELECT_TO_PLAY_TIMEOUT = 500;

export const PRESET_NO_CONTENT_TTS_FILE = 'no_presets_kara.mp3';
export const PRESET_UNAVAILABLE_TTS_FILE = 'preset_unavailable.mp3';

export type PresetItem = Preset & { type: 'preset' };
export type UnavailableItem = {
  context_uri: string;
  slot_index: PresetNumber;
  type: 'unavailable';
};
type PlaceholderItem = { slot_index: PresetNumber; type: 'placeholder' };
export type PresetOrPlaceholderOrUnavailable =
  | PresetItem
  | PlaceholderItem
  | UnavailableItem;

class PresetsUiState {
  presetsDataStore: PresetsDataStore;
  presetsUbiLogger: PresetsUbiLogger;
  overlayController: OverlayController;
  playerStore: PlayerStore;
  shelfStore: ShelfStore;
  queueStore: QueueStore;
  viewStore: ViewStore;
  npvStore: NpvStore;
  interappActions: InterappActions;

  constructor(
    presetsDataStore: PresetsDataStore,
    presetsUbiLogger: PresetsUbiLogger,
    overlayController: OverlayController,
    playerStore: PlayerStore,
    shelfStore: ShelfStore,
    queueStore: QueueStore,
    viewStore: ViewStore,
    npvStore: NpvStore,
    interappActions: InterappActions,
  ) {
    this.presetsDataStore = presetsDataStore;
    this.presetsUbiLogger = presetsUbiLogger;
    this.overlayController = overlayController;
    this.playerStore = playerStore;
    this.shelfStore = shelfStore;
    this.queueStore = queueStore;
    this.viewStore = viewStore;
    this.npvStore = npvStore;
    this.interappActions = interappActions;

    makeAutoObservable(this, {
      presetsDataStore: false,
      presetsUbiLogger: false,
      overlayController: false,
      playerStore: false,
      shelfStore: false,
      queueStore: false,
      viewStore: false,
      npvStore: false,
      interappActions: false,
    });

    this.presetsDataStore.onSavePresetFailed(() => {
      this.clearTempPreset();
      overlayController.maybeShowAModal();
    });

    this.presetsDataStore.onPresetsChanged(() => {
      this.clearTempPreset();
    });
  }

  selectedPresetNumber: PresetNumber = 1;
  tempPreset: Preset | undefined; // local state while saving

  get presets(): PresetOrPlaceholderOrUnavailable[] {
    return PRESET_NUMBERS.map((presetNumber: PresetNumber) => {
      const preset = this.getTempOrSavedPreset(presetNumber);
      if (preset) {
        if (this.presetsDataStore.isUnavailable(presetNumber)) {
          return { ...preset, type: 'unavailable' };
        }
        return { ...preset, type: 'preset' };
      }
      return {
        slot_index: presetNumber,
        type: 'placeholder',
      };
    });
  }

  get currentIsPresets(): boolean {
    return this.overlayController.isShowing('presets');
  }

  get currentContextUri(): string {
    return isPlaylistRecommendedUri(this.playerStore.contextUri)
      ? this.playerStore.contextUri.replace(':recommended', '')
      : this.playerStore.contextUri;
  }

  getPresetFromCurrentContext(withNumber: PresetNumber): Preset {
    const imageId =
      this.shelfStore.shelfItems.find(
        (item) => item.uri === this.currentContextUri,
      )?.image_id ?? this.playerStore.currentImageId;

    return {
      context_uri: this.currentContextUri,
      image_url: imageId,
      name: titleBasedOnType(this.playerStore, this.queueStore),
      slot_index: withNumber,
    };
  }

  getTempOrSavedPreset(presetNumber: PresetNumber): Preset | undefined {
    return this.tempPreset?.slot_index === presetNumber
      ? this.tempPreset
      : this.presetsDataStore.getPreset(presetNumber);
  }

  get isPlaying(): boolean {
    return this.playerStore.playing;
  }

  updateSelectedPreset(presetNumber: PresetNumber): void {
    this.selectedPresetNumber = presetNumber;
  }

  highlightPreset(): void {
    const indexOfNowPlayingInPresets = this.presets.findIndex(
      (preset) =>
        preset.type === 'preset' &&
        this.playerStore.contextUri === preset.context_uri,
    );
    switch (indexOfNowPlayingInPresets) {
      case 0:
        this.selectedPresetNumber = 1;
        break;
      case 1:
        this.selectedPresetNumber = 2;
        break;
      case 2:
        this.selectedPresetNumber = 3;
        break;
      case 3:
        this.selectedPresetNumber = 4;
        break;
      default:
        //  -1 when no find, none preset is playing, then mark preset 1
        this.selectedPresetNumber = 1;
        break;
    }
  }

  handleDialLeft(): void {
    if (this.selectedPresetNumber > 1) {
      this.selectedPresetNumber--;
      this.logDialTurn();
    }
  }

  handleDialRight(): void {
    if (this.selectedPresetNumber < 4) {
      this.selectedPresetNumber++;
      this.logDialTurn();
    }
  }

  handleDialPress(): void {
    this.playFocusedPreset();
  }

  handlePresetButtonLongPress(presetNumber: PresetNumber) {
    if (this.playerStore.isPlayingSpotify) {
      const uriToSave = this.currentContextUri.startsWith('spotify:search')
        ? this.playerStore.currentTrack.uri
        : this.currentContextUri;

      this.presetsDataStore.savePreset(uriToSave, presetNumber, 'tactile');
      this.setTempPreset(presetNumber);
      this.logPresetSaved(uriToSave, presetNumber);
      this.updateSelectedPreset(presetNumber);
      this.overlayController.showPresets();
    }
  }

  playPresetOrTts(presetNumber: PresetNumber, interactionId?: string): void {
    if (!this.presetsDataStore.hasAnyPreset) {
      return;
    }
    const presetUri = this.getTempOrSavedPreset(presetNumber)?.context_uri;
    if (this.presetsDataStore.isUnavailable(presetNumber)) {
      this.interappActions.getTts(PRESET_UNAVAILABLE_TTS_FILE);
    } else if (presetUri) {
      if (!this.playerStore.playing) {
        this.playerStore.setPlaying(true);
      }
      this.playerStore.setContextUri(presetUri);
      this.playerStore.playItem(
        presetUri,
        FEATURE_IDENTIFIER_PRESETS,
        interactionId,
      );
    } else {
      this.playTts(PRESET_NO_CONTENT_TTS_FILE);
    }
  }

  playTts(fileName: string) {
    this.interappActions.getTts(fileName);
  }

  handlePresetButtonPress(presetNumber: PresetNumber) {
    this.npvStore.tipsUiState.dismissVisibleTip();
    if (!this.presetsDataStore.hasAnyPreset) {
      return;
    }

    const pressedPreset = this.getTempOrSavedPreset(presetNumber);

    let interactionId;
    if (!pressedPreset) {
      this.presetsUbiLogger.logPlaceholderPresetHardwareButtonClicked();
    } else {
      interactionId = this.logPresetClicked(presetNumber);
      this.viewStore.showNpv({ type: 'origin', value: 'preset' });
    }

    this.playPresetOrTts(presetNumber, interactionId);
    this.updateSelectedPreset(presetNumber);

    this.overlayController.showPresets();
  }

  handleTapOnPreset(presetNumber: PresetNumber): void {
    const interactionId = this.getTempOrSavedPreset(presetNumber)
      ? this.logTouchToPlay(presetNumber)
      : this.logTouchPlaceHolder(presetNumber);

    this.playPresetOrTts(presetNumber, interactionId);

    this.updateSelectedPreset(presetNumber);
    window.setTimeout(
      () => this.overlayController.resetAndMaybeShowAModal(),
      PRESET_SELECT_TO_PLAY_TIMEOUT,
    );
  }

  handleSwipeUp(): void {
    this.presetsUbiLogger.logSwipeUp();
    this.overlayController.resetAndMaybeShowAModal();
  }

  playFocusedPreset() {
    this.playPresetOrTts(this.selectedPresetNumber, this.logDialPress());
  }

  setTempPreset(presetSlot: PresetNumber): void {
    this.tempPreset = this.getPresetFromCurrentContext(presetSlot);
  }

  clearTempPreset(): void {
    this.tempPreset = undefined;
  }

  showNowPlaying(uri: string | undefined): boolean {
    return this.playerStore.contextUri === uri;
  }

  reset(): void {
    this.selectedPresetNumber = 1;
    this.tempPreset = undefined;
  }

  /*
   * UBI
   * */

  logPresetsImpression() {
    this.presetsUbiLogger.logPresetsImpression();
  }

  private logPresetClicked = (
    presetNumber: PresetNumber,
  ): string | undefined => {
    const uri = this.getTempOrSavedPreset(presetNumber)?.context_uri;
    if (!uri) {
      return undefined;
    }
    switch (presetNumber) {
      case 1:
        return this.presetsUbiLogger.logPresetButtonOneClicked(uri);
      case 2:
        return this.presetsUbiLogger.logPresetButtonTwoClicked(uri);
      case 3:
        return this.presetsUbiLogger.logPresetButtonThreeClicked(uri);
      case 4:
        return this.presetsUbiLogger.logPresetButtonFourClicked(uri);
      default:
        break;
    }
    return undefined;
  };

  private logPresetSaved = (contextUri: string, presetNumber: PresetNumber) => {
    switch (presetNumber) {
      case 1:
        this.presetsUbiLogger.logPresetOneSaved(contextUri);
        break;
      case 2:
        this.presetsUbiLogger.logPresetTwoSaved(contextUri);
        break;
      case 3:
        this.presetsUbiLogger.logPresetThreeSaved(contextUri);
        break;
      case 4:
        this.presetsUbiLogger.logPresetFourSaved(contextUri);
        break;
      default:
        break;
    }
  };

  logDialTurn = () =>
    this.presetsUbiLogger.logDialTurn(
      this.selectedPresetNumber,
      this.getTempOrSavedPreset(this.selectedPresetNumber)?.context_uri ??
        'placeholder-uri',
    );

  logDialPress = () =>
    this.presetsUbiLogger.logDialPress(
      this.selectedPresetNumber,
      this.getTempOrSavedPreset(this.selectedPresetNumber)?.context_uri ??
        'placeholder-uri',
    );

  logTouchToPlay = (presetNumber: PresetNumber) =>
    this.presetsUbiLogger.logTouchToPlay(
      presetNumber,
      this.getTempOrSavedPreset(presetNumber)?.context_uri ?? 'placeholder-uri',
    );

  logTouchPlaceHolder = (presetNumber: PresetNumber) =>
    this.presetsUbiLogger.logTouchPlaceHolder(presetNumber);
}

export default PresetsUiState;

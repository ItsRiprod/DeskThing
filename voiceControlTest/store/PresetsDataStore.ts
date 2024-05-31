import InterappActions from 'middleware/InterappActions';
import {
  autorun,
  makeAutoObservable,
  ObservableMap,
  reaction,
  runInAction,
} from 'mobx';
import ErrorHandler from 'eventhandler/ErrorHandler';
import { tryActionNTimes } from 'helpers/Retry';
import ImageStore from './ImageStore';
import RemoteConfigStore from './RemoteConfigStore';
import VersionStatusStore from './VersionStatusStore';

const NUMBER_OF_TIMES_TO_RETRY = 3;

export type PresetNumber = 1 | 2 | 3 | 4;

type PresetSavingSource = 'tactile' | 'voice';

export const PRESET_NUMBERS: PresetNumber[] = [1, 2, 3, 4];

export interface Preset {
  context_uri: string;
  image_url?: string;
  slot_index: PresetNumber;
  name?: string;
  description?: string;
}

export type SetPresetRequest = [
  {
    version: 1;
    context_uri: string;
    slot_index: PresetNumber;
    source: PresetSavingSource;
  },
];

type GetPresetsResponse = {
  result: Array<Preset>;
  success: boolean;
};

export type SetPresetResponse = { result: Preset[] | null; success: boolean }; // can be null in older mobile versions

const _isValidResponse = (response: any): boolean =>
  response && response.result && Array.isArray(response.result);

const isValidResponse = (response: any): boolean =>
  response?.presets?.presets && Array.isArray(response.presets.presets);

const isValidSetPresetResponse = (response: any): boolean =>
  response === null ||
  (response && response.result && Array.isArray(response.result));

export const isValidPresetNumber = (number: string) => {
  return ['1', '2', '3', '4'].includes(number);
};

export const parsePresetNumber = (presetNumber: string): PresetNumber => {
  switch (presetNumber) {
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    case '4':
      return 4;
    default:
      throw new Error(`could not parse preset number: ${presetNumber}`);
  }
};

const getSetPresetRequest = (
  contextUri: string,
  slotIndex: PresetNumber,
  source: PresetSavingSource,
): SetPresetRequest => [
  {
    context_uri: contextUri,
    slot_index: slotIndex,
    source: source,
    version: 1,
  },
];

class PresetsDataStore {
  interappActions: InterappActions;
  errorHandler: ErrorHandler;
  imageStore: ImageStore;
  remoteConfigStore: RemoteConfigStore;
  versionStatusStore: VersionStatusStore;

  presets: ObservableMap<PresetNumber, Preset> = new ObservableMap<
    PresetNumber,
    Preset
  >();

  loading: boolean = false;
  loadingFailed: boolean = false;
  saveFailed: boolean = false;

  constructor(
    interappActions: InterappActions,
    errorHandler: ErrorHandler,
    imageStore: ImageStore,
    remoteConfigStore: RemoteConfigStore,
    versionStatusStore: VersionStatusStore,
  ) {
    this.interappActions = interappActions;
    this.errorHandler = errorHandler;
    this.imageStore = imageStore;
    this.remoteConfigStore = remoteConfigStore;
    this.versionStatusStore = versionStatusStore;

    makeAutoObservable(this, {
      interappActions: false,
      errorHandler: false,
      imageStore: false,
      remoteConfigStore: false,
    });
  }

  async loadPresets() {
    if (this.loading) {
      return;
    }

    const { result, success } = await tryActionNTimes({
      asyncAction: () => {
        return this.remoteConfigStore.graphQLPresetsEnabled
          ? this.fetchPresets()
          : this._fetchPresets();
      },
      n: NUMBER_OF_TIMES_TO_RETRY,
    });

    runInAction(() => {
      result.forEach((preset) => {
        this.presets.set(preset.slot_index, preset);
        if (preset.image_url) {
          this.imageStore.loadImage(preset.image_url, 168);
        }
      });
      this.loadingFailed = !success;
    });
  }

  /**
   * @deprecated Use fetchPresets
   */
  private async _fetchPresets(): Promise<GetPresetsResponse> {
    let toReturn = { result: [], success: false };

    try {
      this.loading = true;
      const response = await this.interappActions._getPresets();
      if (_isValidResponse(response)) {
        toReturn = { result: response.result, success: true };
      }
    } catch (e: any) {
      this.errorHandler.logUnexpectedError(e, 'Failed to fetch preset items');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
    return toReturn;
  }

  private async fetchPresets(): Promise<GetPresetsResponse> {
    let toReturn = { result: [], success: false };

    if (!this.versionStatusStore.serial) {
      throw new Error('fetching presets but serial was not present');
    }

    try {
      this.loading = true;
      const response = await this.interappActions.getPresets(
        this.versionStatusStore.serial,
      );
      if (isValidResponse(response)) {
        toReturn = { result: response.presets.presets, success: true };
      }
    } catch (e: any) {
      this.errorHandler.logUnexpectedError(e, 'Failed to fetch preset items');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
    return toReturn;
  }

  private async callSetPreset(
    contextUri: string,
    presetNumber: PresetNumber,
    source: PresetSavingSource,
  ): Promise<SetPresetResponse> {
    let toReturn: SetPresetResponse = { result: [], success: false };

    try {
      const response = await this.interappActions.setPreset(
        getSetPresetRequest(contextUri, presetNumber, source),
      );
      if (isValidSetPresetResponse(response)) {
        toReturn = { result: response?.result ?? null, success: true };
      }
    } catch (e: any) {
      this.errorHandler.logUnexpectedError(e, 'Failed to update preset items');
    }

    return toReturn;
  }

  async savePreset(
    contextUri: string,
    presetNumber: PresetNumber,
    source: PresetSavingSource,
  ): Promise<boolean> {
    const savePresetResponse = await tryActionNTimes({
      asyncAction: () => this.callSetPreset(contextUri, presetNumber, source),
      n: NUMBER_OF_TIMES_TO_RETRY,
    });
    runInAction(() => {
      if (!savePresetResponse.success) {
        this.saveFailed = true;
        return;
      }

      if (savePresetResponse.result) {
        savePresetResponse.result.forEach((preset) =>
          this.presets.set(preset.slot_index, preset),
        );
      } else {
        this.loadPresets();
      }
    });
    return savePresetResponse.success;
  }

  getPresetUri(presetNumber: PresetNumber): string | undefined {
    return this.getPreset(presetNumber)?.context_uri;
  }

  getPreset(presetNumber: PresetNumber): Preset | undefined {
    return this.presets.get(presetNumber);
  }

  get emptyPresetNumbers(): PresetNumber[] {
    return PRESET_NUMBERS.filter((number) => !this.presets.has(number));
  }

  get hasAnyPreset() {
    return PRESET_NUMBERS.some((number) => this.presets.has(number));
  }

  isUnavailable(presetNumber: PresetNumber): boolean {
    return (
      this.getPreset(presetNumber) !== undefined &&
      !this.getPreset(presetNumber)?.image_url &&
      !this.getPreset(presetNumber)?.description &&
      !this.getPreset(presetNumber)?.name
    );
  }

  setSaveFailed(saveFailed: boolean): void {
    this.saveFailed = saveFailed;
  }

  reset(): void {
    this.presets.clear();
    this.loadingFailed = false;
    this.saveFailed = false;
    this.loading = false;
  }

  onSavePresetFailed(callback: () => void): void {
    autorun(() => {
      if (this.saveFailed) {
        runInAction(callback);
      }
    });
  }

  onPresetsChanged(callback: (uris) => void): void {
    reaction(
      () =>
        Array.from(this.presets.values())
          .map((p) => p.context_uri)
          .join('#'),
      callback,
    );
  }
}

export default PresetsDataStore;

import NpvStore from './NpvStore';
import PlayerStore from './PlayerStore';
import Socket from '../Socket';
import InterappActions from 'middleware/InterappActions';
import MiddlewareActions from 'middleware/MiddlewareActions';
import BluetoothStore from './BluetoothStore';
import RemoteControlStore from './RemoteControlStore';
import ImageStore from './ImageStore';
import ViewStore from './ViewStore';
import ShelfStore from './ShelfStore';
import WindLevelStore from './WindLevelStore';
import OtaStore from './OtaStore';
import PresetsController from 'component/Presets/PresetsController';
import SettingsStore from './SettingsStore';
import OnboardingStore from './OnboardingStore';
import VoiceStore from './VoiceStore';
import SessionStateStore from './SessionStateStore';
import TracklistStore from './TracklistStore';
import TimerStore from './TimerStore';
import DevOptionsStore from './DevOptionsStore';
import QueueStore from './QueueStore';
import HardwareStore from './HardwareStore';
import SetupStore from './SetupStore';
import PhoneConnectionStore from './PhoneConnectionStore';
import ErrorHandler from 'eventhandler/ErrorHandler';
import PermissionsStore from './PermissionStore';
import RemoteConfigStore from './RemoteConfigStore';
import VolumeStore from './VolumeStore';
import UbiLogger from 'eventhandler/UbiLogger';
import RadioStore from './RadioStore';
import ChildItemStore from './ChildItemStore';
import HomeItemsStore from './HomeItemsStore';
import PodcastSpeedStore from './PodcastSpeedStore';
import PodcastStore from './PodcastStore';
import SavedStore from './SavedStore';
import PresetsDataStore from './PresetsDataStore';
import TipsStore from './TipsStore';
import SwipeDownHandleUiState from 'component/SwipeDownHandle/SwipeDownHandleUiState';
import PhoneCallController from 'component/PhoneCall/PhoneCallController';
import NightModeController from 'component/NightMode/NightModeController';
import AirVentInterferenceController from 'component/Npv/WindAlertBanner/AirVentInterferenceController';
import VersionStatusStore from './VersionStatusStore';
import {
  createOverlayController,
  OverlayController,
} from 'component/Overlays/OverlayController';
import PromoController from 'component/Promo/PromoController';
import DisconnectedLogger from 'eventhandler/DisconnectedLogger';
import SeedableStorageInterface from 'middleware/SeedableStorageInterface';
import { reaction } from 'mobx';

export type RootStoreProps = {
  store: RootStore;
};

export class RootStore {
  versionStatusStore: VersionStatusStore;
  bluetoothStore: BluetoothStore;
  childItemStore: ChildItemStore;
  devOptionsStore: DevOptionsStore;
  errorHandler: ErrorHandler;
  hardwareStore: HardwareStore;
  homeItemsStore: HomeItemsStore;
  imageStore: ImageStore;
  interappActions: InterappActions;
  npvStore: NpvStore;
  onboardingStore: OnboardingStore;
  otaStore: OtaStore;
  overlayController: OverlayController;
  permissionsStore: PermissionsStore;
  phoneConnectionStore: PhoneConnectionStore;
  playerStore: PlayerStore;
  podcastSpeedStore: PodcastSpeedStore;
  podcastStore: PodcastStore;
  presetsDataStore: PresetsDataStore;
  presetsController: PresetsController;
  promoController: PromoController;
  queueStore: QueueStore;
  radioStore: RadioStore;
  remoteConfigStore: RemoteConfigStore;
  remoteControlStore: RemoteControlStore;
  savedStore: SavedStore;
  sessionStateStore: SessionStateStore;
  settingsStore: SettingsStore;
  setupStore: SetupStore;
  shelfStore: ShelfStore;
  timerStore: TimerStore;
  tracklistStore: TracklistStore;
  ubiLogger: UbiLogger;
  disconnectedLogger: DisconnectedLogger;
  viewStore: ViewStore;
  voiceStore: VoiceStore;
  volumeStore: VolumeStore;
  windLevelStore: WindLevelStore;
  swipeDownUiState: SwipeDownHandleUiState;
  tipsStore: TipsStore;
  phoneCallController: PhoneCallController;
  nightModeController: NightModeController;
  airVentInterferenceController: AirVentInterferenceController;
  persistentStorage: SeedableStorageInterface;

  constructor(
    interappActions: InterappActions,
    middlewareActions: MiddlewareActions,
    persistentStorage: SeedableStorageInterface,
    socket: Socket,
    errorHandler: ErrorHandler,
  ) {
    this.persistentStorage = persistentStorage;

    this.interappActions = interappActions;
    this.errorHandler = errorHandler;

    this.remoteConfigStore = new RemoteConfigStore(
      this,
      socket,
      middlewareActions,
    );
    this.hardwareStore = new HardwareStore(socket, middlewareActions);
    this.ubiLogger = new UbiLogger(
      interappActions,
      this.remoteConfigStore,
      this.hardwareStore,
    );

    this.sessionStateStore = new SessionStateStore(this, socket);
    this.versionStatusStore = new VersionStatusStore(socket, middlewareActions);
    this.imageStore = new ImageStore(this, interappActions);
    this.otaStore = new OtaStore(this, socket);

    this.playerStore = new PlayerStore(this, interappActions, socket);
    this.timerStore = new TimerStore(this);
    this.remoteControlStore = new RemoteControlStore(this, socket);
    this.disconnectedLogger = new DisconnectedLogger(this, middlewareActions);

    this.bluetoothStore = new BluetoothStore(this, socket, middlewareActions);
    this.voiceStore = new VoiceStore(this, socket, middlewareActions);
    this.windLevelStore = new WindLevelStore(this, socket, interappActions);

    this.onboardingStore = new OnboardingStore(
      this,
      socket,
      interappActions,
      middlewareActions,
    );
    this.tracklistStore = new TracklistStore(this);
    this.devOptionsStore = new DevOptionsStore(this);
    this.overlayController = createOverlayController(this, this.ubiLogger);
    this.airVentInterferenceController = new AirVentInterferenceController(
      this,
    );
    this.volumeStore = new VolumeStore(this, socket, interappActions);
    this.setupStore = new SetupStore(this, socket);
    this.viewStore = new ViewStore(this);
    this.queueStore = new QueueStore(
      socket,
      this.playerStore,
      this.imageStore,
      this.viewStore,
      this.hardwareStore,
      this.ubiLogger.queueUbiLogger,
      interappActions,
    );
    this.childItemStore = new ChildItemStore(this, interappActions);
    this.homeItemsStore = new HomeItemsStore(this, interappActions);

    this.tipsStore = new TipsStore(interappActions, errorHandler);
    this.presetsDataStore = new PresetsDataStore(
      interappActions,
      errorHandler,
      this.imageStore,
      this.remoteConfigStore,
      this.versionStatusStore,
    );
    this.podcastSpeedStore = new PodcastSpeedStore(
      this,
      interappActions,
      socket,
    );
    this.phoneCallController = new PhoneCallController(
      this,
      socket,
      middlewareActions,
    );
    this.savedStore = new SavedStore(
      this.playerStore,
      interappActions,
      errorHandler,
    );
    this.permissionsStore = new PermissionsStore(
      this.overlayController,
      socket,
      interappActions,
      errorHandler,
    );
    this.npvStore = new NpvStore(this, middlewareActions);
    this.shelfStore = new ShelfStore(this, interappActions);
    this.nightModeController = new NightModeController(this);
    this.settingsStore = new SettingsStore(this, middlewareActions, socket);
    this.promoController = new PromoController(this, middlewareActions);
    this.presetsController = new PresetsController(this, interappActions);
    this.phoneConnectionStore = new PhoneConnectionStore(
      this,
      middlewareActions,
    );

    this.radioStore = new RadioStore(this);
    this.podcastStore = new PodcastStore(
      interappActions,
      this.remoteConfigStore,
      errorHandler,
    );
    this.swipeDownUiState = new SwipeDownHandleUiState(
      this.overlayController,
      this.presetsController,
      this.ubiLogger.presetsUbiLogger,
    );

    this.fetchAppState();
  }

  resetAppState() {
    this.tracklistStore.reset();
    this.presetsController.reset();
    this.presetsDataStore.reset();
    this.queueStore.reset();
    this.shelfStore.reset();
    this.childItemStore.reset();
    this.podcastStore.reset();
    this.homeItemsStore.reset();
    this.viewStore.reset();
    this.tipsStore.clearTip();
    this.ubiLogger.clearQueue();
    this.playerStore.reset();
    this.remoteConfigStore.reset();
    this.sessionStateStore.reset();
    this.phoneCallController.reset();
  }

  fetchAppState() {
    reaction(
      () =>
        this.sessionStateStore.isLoggedIn &&
        this.sessionStateStore.phoneHasNetwork &&
        this.versionStatusStore.serial &&
        this.remoteConfigStore.messageReceived,
      (shouldReload) => {
        if (shouldReload) {
          this.shelfStore.getShelfData();
          this.presetsDataStore.loadPresets();
        }
      },
    );
  }
}

import MiddlewareActions from 'middleware/MiddlewareActions';
import { makeAutoObservable } from 'mobx';
import Socket from '../Socket';
import { RootStore } from './RootStore';

export type RemoteConfigEventMessage = {
  type: 'remote_configuration_update';
  payload: RemoteConfig;
};

export const DEFAULT_REMOTE_CONFIG = {
  developer_menu_enabled: false,
  batch_ubi_logs: false,
  log_requests: false,
  log_signal_strength: false,
  podcast_trailer_enabled: false,
  use_superbird_namespace: false,
  use_volume_superbird_namespace: false,
  handle_incoming_phone_calls: false,
  night_mode_strength: 30,
  night_mode_slope: 14,
  graphql_endpoint_enabled: false,
  enable_push_to_talk_shelf: false,
  non_spotify_playback_ios: false,
  graphql_for_shelf_enabled: false,
};

export type RemoteConfig = typeof DEFAULT_REMOTE_CONFIG;

class RemoteConfigStore {
  rootStore: RootStore;
  middlewareActions: MiddlewareActions;

  remoteConfig: RemoteConfig = { ...DEFAULT_REMOTE_CONFIG };
  messageReceived: boolean = false;

  constructor(
    rootStore: RootStore,
    socket: Socket,
    middlewareActions: MiddlewareActions,
  ) {
    makeAutoObservable(this, {
      rootStore: false,
      middlewareActions: false,
    });

    this.middlewareActions = middlewareActions;
    this.rootStore = rootStore;
    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
  }

  onMiddlewareEvent(msg: RemoteConfigEventMessage) {
    switch (msg.type) {
      case 'remote_configuration_update':
        Object.assign(this.remoteConfig, msg.payload ?? {});
        this.messageReceived = true;
        break;
      default:
        break;
    }
  }

  refreshRemoteConfig() {
    this.middlewareActions.refreshRemoteConfig();
  }

  get batchUbiLogs(): boolean {
    return this.remoteConfig.batch_ubi_logs;
  }

  get logRequests(): boolean {
    return this.remoteConfig.log_requests;
  }

  get logSignalStrength(): boolean {
    return this.remoteConfig.log_signal_strength;
  }

  get useSuperbirdNamespace(): boolean {
    return this.remoteConfig.use_superbird_namespace;
  }

  get useVolumeSuperbirdNamespace(): boolean {
    return this.remoteConfig.use_volume_superbird_namespace;
  }

  get showDeveloperMenu(): boolean {
    return this.remoteConfig.developer_menu_enabled;
  }

  get podcastTrailerEnabled(): boolean {
    return this.remoteConfig.podcast_trailer_enabled;
  }

  get handleIncomingPhoneCalls(): boolean {
    return this.remoteConfig.handle_incoming_phone_calls;
  }

  get otherMediaEnabled(): boolean {
    return this.remoteConfig.non_spotify_playback_ios;
  }

  get nightModeStrength(): number {
    return this.remoteConfig.night_mode_strength;
  }

  get nightModeSlope(): number {
    return this.remoteConfig.night_mode_slope;
  }

  get graphQLPresetsEnabled(): boolean {
    return this.remoteConfig.graphql_endpoint_enabled;
  }

  get graphQLShelfEnabled(): boolean {
    return this.remoteConfig.graphql_for_shelf_enabled;
  }

  get pushToTalkShelfEnabled(): boolean {
    return this.remoteConfig.enable_push_to_talk_shelf;
  }

  reset() {
    this.remoteConfig = { ...DEFAULT_REMOTE_CONFIG };
    this.messageReceived = false;
  }
}

export default RemoteConfigStore;

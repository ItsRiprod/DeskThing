import MiddlewareActions from 'middleware/MiddlewareActions';
import { makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';
import { PhoneConnectionModalView } from './PhoneConnectionStore';
import SettingsUbiLogger from 'component/Settings/SettingsUbiLogger';
import createSubmenuUiState, {
  SubmenuUiState,
} from 'component/Settings/Submenu/SubmenuUiState';
import createDisplayAndBrightnessUiState, {
  DisplayAndBrightnessUiState,
} from 'component/Settings/DisplayAndBrightness/DisplayAndBrightnessUiState';
import createPhoneCallsUiState, {
  PhoneCallsUiState,
} from 'component/Settings/PhoneCalls/PhoneCallsUiState';
import createUnavailableSettingsBannerUiState, {
  UnavailableSettingsBannerUiState,
} from 'component/Settings/UnavailableSettingBanner/UnavailableSettingsBannerUiState';
import createTipsOnDemandUiState, {
  TipsOnDemandUiState,
} from 'component/Settings/TipsOnDemand/TipsOnDemandUiState';
import Socket from 'Socket';

export enum MainMenuItemId {
  SETTINGS_ROOT = 'SETTINGS_ROOT',
  MIC = 'MIC',
  PHONE_CONNECTION = 'PHONE_CONNECTION',
  OPTIONS = 'OPTIONS',
  ABOUT = 'ABOUT',
  TIPS = 'TIPS',
  RESTART = 'RESTART',
  DEVELOPER_OPTIONS = 'DEVELOPER_OPTIONS',
  OTHER_VOICE_ASSISTANTS = 'OTHER_VOICE_ASSISTANTS',
}

export enum OptionsMenuItemId {
  PHONE_CALLS = 'PHONE_CALLS',
  PHONE_CALLS_TOGGLE = 'PHONE_CALLS_TOGGLE',
  AIR_VENT_INTERFERENCE = 'AIR_VENT_INTERFERENCE',
  DISPLAY_AND_BRIGHTNESS = 'DISPLAY_AND_BRIGHTNESS',
  TIPS_TOGGLE = 'TIPS_TOGGLE',
}

export enum AboutMenuItemId {
  SERIAL = 'SERIAL',
  APP_VERSION = 'APP_VERSION',
  OS_VERSION = 'OS_VERSION',
  MODEL_NAME = 'MODEL_NAME',
  COUNTRY = 'COUNTRY',
  FCC_ID_MODEL_NAME = 'FCC_ID_MODEL_NAME',
  IC_ID_MODEL_NAME = 'IC_ID_MODEL_NAME',
  HVIN = 'HVIN',
  LICENSE = 'LICENSE',
}

export enum RestartMenuItemId {
  POWER_OFF_TUTORIAL = 'power_off_tutorial',
  RESTART_CONFIRM = 'restart_confirm',
  FACTORY_RESET = 'factory_reset',
}

export type MenuItemId =
  | MainMenuItemId
  | OptionsMenuItemId
  | AboutMenuItemId
  | RestartMenuItemId;

export enum AnimationType {
  BOTTOM_UP,
  FADE_IN,
}

export type ViewType = 'toggle' | 'key-value' | 'parent';

export type View = {
  id: MenuItemId;
  label: string;
  value?: string;
  rows?: View[];
  index: number;
  visible: () => boolean;
  animationType?: AnimationType;
  disabledOffline?: boolean;
  type: ViewType;
};

class SettingsStore {
  rootStore: RootStore;
  middlewareActions: MiddlewareActions;
  submenuUiState: SubmenuUiState;
  displayAndBrightnessUiState: DisplayAndBrightnessUiState;
  phoneCallsUiState: PhoneCallsUiState;
  tipsOnDemandUiState: TipsOnDemandUiState;
  unavailableSettingsBannerUiState: UnavailableSettingsBannerUiState;

  constructor(
    rootStore: RootStore,
    middlewareActions: MiddlewareActions,
    socket: Socket,
  ) {
    makeAutoObservable(this, {
      rootStore: false,
      middlewareActions: false,
      submenuUiState: false,
      phoneCallsUiState: false,
      tipsOnDemandUiState: false,
      displayAndBrightnessUiState: false,
      unavailableSettingsBannerUiState: false,
    });

    this.rootStore = rootStore;
    this.middlewareActions = middlewareActions;

    this.submenuUiState = createSubmenuUiState(
      this,
      this.rootStore.npvStore.tipsUiState,
      this.rootStore.phoneCallController,
      this.rootStore.versionStatusStore,
    );
    this.displayAndBrightnessUiState = createDisplayAndBrightnessUiState(
      this.rootStore.nightModeController,
      this.rootStore.ubiLogger.settingsUbiLogger,
    );

    this.phoneCallsUiState = createPhoneCallsUiState(
      this,
      rootStore.phoneCallController,
      rootStore.overlayController,
      rootStore.hardwareStore,
    );

    this.tipsOnDemandUiState = createTipsOnDemandUiState(
      this,
      rootStore.tipsStore,
      socket,
    );

    this.unavailableSettingsBannerUiState =
      createUnavailableSettingsBannerUiState(
        rootStore.ubiLogger.settingsUbiLogger,
      );
  }

  factoryResetConfirmationIsActive = true;

  airVentInterferenceView: View = {
    id: OptionsMenuItemId.AIR_VENT_INTERFERENCE,
    label: 'Air vent interference',
    index: 0,
    disabledOffline: true,
    visible: () => true,
    type: 'parent',
  };

  nightModeView: View = {
    id: OptionsMenuItemId.DISPLAY_AND_BRIGHTNESS,
    label: 'Display and brightness',
    index: 0,
    disabledOffline: true,
    visible: () => true,
    type: 'parent',
  };

  phoneConnectionView: View = {
    id: MainMenuItemId.PHONE_CONNECTION,
    label: 'Phone connection',
    index: 0,
    visible: () => true,
    type: 'parent',
  };

  phoneCallsView: View = {
    id: OptionsMenuItemId.PHONE_CALLS,
    label: 'Phone calls',
    index: 0,
    disabledOffline: false,
    visible: () => this.rootStore?.remoteConfigStore.handleIncomingPhoneCalls,
    type: 'parent',
    rows: [
      {
        id: OptionsMenuItemId.PHONE_CALLS_TOGGLE,
        label: 'Phone calls onscreen',
        type: 'toggle',
        visible: () => true,
        index: 0,
      },
    ],
  };

  developerOptionsView: View = {
    id: MainMenuItemId.DEVELOPER_OPTIONS,
    label: 'Developer options',
    index: 0,
    type: 'parent',
    visible: () => {
      if (this.rootStore) {
        return this.rootStore.remoteConfigStore.showDeveloperMenu;
      }
      return false;
    },
  };

  licenseView: View = {
    id: AboutMenuItemId.LICENSE,
    label: 'Third party software',
    index: 0,
    type: 'parent',
    visible: () => true,
  };

  aboutInfoView: View[] = [
    {
      id: AboutMenuItemId.SERIAL,
      label: 'Serial No.',
      index: 0,
      visible: () => true,
      type: 'key-value',
    },
    {
      id: AboutMenuItemId.APP_VERSION,
      label: 'App Version',
      index: 0,
      visible: () => true,
      type: 'key-value',
    },
    {
      id: AboutMenuItemId.OS_VERSION,
      label: 'OS Version',
      index: 0,
      visible: () => true,
      type: 'key-value',
    },
    {
      id: AboutMenuItemId.MODEL_NAME,
      label: 'Model No.',
      index: 0,
      visible: () => true,
      type: 'key-value',
    },
    {
      id: AboutMenuItemId.COUNTRY,
      label: 'Country',
      index: 0,
      visible: () => true,
      type: 'key-value',
    },
    {
      id: AboutMenuItemId.FCC_ID_MODEL_NAME,
      label: 'FCC ID',
      index: 0,
      visible: () => true,
      type: 'key-value',
    },
    {
      id: AboutMenuItemId.IC_ID_MODEL_NAME,
      label: 'IC ID',
      index: 0,
      visible: () => true,
      type: 'key-value',
    },
    {
      id: AboutMenuItemId.HVIN,
      label: 'HVIN',
      index: 0,
      visible: () => true,
      type: 'key-value',
    },
    this.licenseView,
  ];

  // Only use copies of this object
  settings: View = {
    id: MainMenuItemId.SETTINGS_ROOT,
    label: 'Main menu',
    index: 0,
    visible: () => true,
    type: 'parent',
    rows: [
      {
        id: MainMenuItemId.MIC,
        label: 'Microphone',
        index: 0,
        disabledOffline: true,
        visible: () => true,
        type: 'toggle',
      },
      this.phoneConnectionView,
      {
        id: MainMenuItemId.OPTIONS,
        label: 'Options',
        index: 0,
        rows: [
          this.nightModeView,
          {
            id: OptionsMenuItemId.TIPS_TOGGLE,
            label: 'Onscreen tips',
            index: 0,
            disabledOffline: true,
            visible: () => true,
            type: 'toggle',
          },
          this.phoneCallsView,
          this.airVentInterferenceView,
        ],
        visible: () => true,
        type: 'parent',
      },
      {
        id: MainMenuItemId.TIPS,
        label: 'Tips',
        disabledOffline: true,
        index: 0,
        visible: () => true,
        type: 'parent',
      },
      {
        id: MainMenuItemId.ABOUT,
        label: 'About',
        index: 0,
        rows: this.aboutInfoView,
        visible: () => true,
        type: 'parent',
      },
      {
        id: MainMenuItemId.RESTART,
        label: 'Power and Reset',
        index: 0,
        rows: [
          {
            id: RestartMenuItemId.RESTART_CONFIRM,
            label: 'Restart',
            index: 0,
            animationType: AnimationType.FADE_IN,
            visible: () => true,
            type: 'parent',
          },
          {
            id: RestartMenuItemId.POWER_OFF_TUTORIAL,
            label: 'Power off/on',
            index: 0,
            animationType: AnimationType.FADE_IN,
            visible: () => true,
            type: 'parent',
          },
          {
            id: RestartMenuItemId.FACTORY_RESET,
            label: 'Factory reset',
            index: 0,
            animationType: AnimationType.FADE_IN,
            visible: () => true,
            type: 'parent',
          },
        ],
        visible: () => true,
        type: 'parent',
      },
      this.developerOptionsView,
    ],
  };

  viewStack: View[] = this.filterOutNonVisible([this.settings]);

  gotoView(view: View) {
    if (view.type === 'parent') {
      this.viewStack.push(view);
    }
  }

  showPhoneSettings() {
    this.gotoView(this.phoneConnectionView);
  }

  showPhoneCalls() {
    const phoneCalls = this.settings.rows
      ?.find((v) => v.id === MainMenuItemId.OPTIONS)
      ?.rows?.find((v) => v.id === OptionsMenuItemId.PHONE_CALLS);

    if (phoneCalls) {
      this.viewStack = [phoneCalls];
    }
  }

  get rows(): View[] {
    if (this.settings.rows) return this.filterOutNonVisible(this.settings.rows);
    return [];
  }

  get currentIsAirVentInterference(): boolean {
    return this.currentView.id === OptionsMenuItemId.AIR_VENT_INTERFERENCE;
  }

  get currentIsPhoneCalls(): boolean {
    return this.currentView.id === OptionsMenuItemId.PHONE_CALLS;
  }

  get currentIsPhoneConnection(): boolean {
    return this.currentView.id === MainMenuItemId.PHONE_CONNECTION;
  }

  get currentIsFactoryReset(): boolean {
    return this.currentView.id === RestartMenuItemId.FACTORY_RESET;
  }

  get currentIsTipsOndemand(): boolean {
    return this.currentView.id === MainMenuItemId.TIPS;
  }

  get currentView(): View {
    return this.viewStack[this.viewStack.length - 1];
  }

  get isMainMenu(): boolean {
    return this.currentView.id === MainMenuItemId.SETTINGS_ROOT;
  }

  get isPowerTutorial(): boolean {
    return this.currentView.id === RestartMenuItemId.POWER_OFF_TUTORIAL;
  }

  get highlightedItem(): View | undefined {
    return this.currentView.rows
      ? this.currentView.rows[this.currentView.index]
      : undefined;
  }

  isMainMenuItemDisabled(disabledOffline: boolean | undefined): boolean {
    const {
      remoteControlStore,
      sessionStateStore,
      permissionsStore,
      viewStore,
    } = this.rootStore;
    return (
      disabledOffline === true &&
      (!remoteControlStore.interappConnected ||
        !sessionStateStore.isLoggedIn ||
        sessionStateStore.isOffline ||
        !permissionsStore.canUseCarThing ||
        viewStore.isSetup)
    );
  }

  handleDialPress() {
    const {
      hardwareStore,
      voiceStore,
      overlayController,
      bluetoothStore,
      phoneConnectionStore,
      npvStore: { tipsUiState },
      ubiLogger: { settingsUbiLogger },
    } = this.rootStore;

    switch (this.currentView.id) {
      case OptionsMenuItemId.AIR_VENT_INTERFERENCE:
        this.rootStore.airVentInterferenceController.handleDialPress();
        break;
      case OptionsMenuItemId.DISPLAY_AND_BRIGHTNESS:
        this.rootStore.settingsStore.displayAndBrightnessUiState.handleDialPress();
        break;
      case MainMenuItemId.ABOUT:
        if (this.highlightedItem?.id === AboutMenuItemId.LICENSE) {
          this.gotoView(this.licenseView);
        }
        break;
      case RestartMenuItemId.RESTART_CONFIRM:
        settingsUbiLogger.logRestartConfirmButtonDialPress();
        hardwareStore.reboot();
        break;
      case RestartMenuItemId.FACTORY_RESET:
        if (this.factoryResetConfirmationIsActive) {
          settingsUbiLogger.logFactoryResetConfirmButtonDialPress();
          hardwareStore.factoryReset();
        } else {
          settingsUbiLogger.logFactoryResetCancelButtonDialPress();
          this.handleBack();
        }
        break;
      case MainMenuItemId.OPTIONS:
        if (this.highlightedItem?.id === OptionsMenuItemId.TIPS_TOGGLE) {
          this.logTipsDialPress(settingsUbiLogger);
          tipsUiState.toggleTipsEnabled();
        } else {
          if (this.highlightedItem) {
            this.logRowDialPressed(this.highlightedItem.id);
            this.gotoView(this.highlightedItem);
          }
        }
        break;
      case MainMenuItemId.SETTINGS_ROOT:
        if (this.highlightedItem?.id === MainMenuItemId.MIC) {
          if (voiceStore.isMicMuted) {
            settingsUbiLogger.logMicDialPressedEnable();
          } else {
            settingsUbiLogger.logMicDialPressedDisable();
          }

          if (
            this.isMainMenuItemDisabled(this.highlightedItem.disabledOffline)
          ) {
            this.unavailableSettingsBannerUiState.showUnavailableBanner();
          } else {
            voiceStore.toggleMic();
          }
        } else {
          if (this.highlightedItem) {
            this.logRowDialPressed(this.highlightedItem.id);
            this.gotoView(this.highlightedItem);
          }
        }
        break;
      case MainMenuItemId.PHONE_CONNECTION:
        if (
          phoneConnectionStore.phoneConnectionModal ===
          PhoneConnectionModalView.FORGET_PHONE_CONFIRM
        ) {
          if (
            phoneConnectionStore.phoneToConnectOrForget &&
            phoneConnectionStore.forgetConfirmationIsActive
          ) {
            settingsUbiLogger.logForgetConfirmDialPress(
              phoneConnectionStore.phoneToConnectOrForget.name,
            );
            phoneConnectionStore.submitForget(
              phoneConnectionStore.phoneToConnectOrForget,
            );
          } else {
            settingsUbiLogger.logForgetCancelDialPress();
            phoneConnectionStore.dismissModal();
          }
        } else if (
          phoneConnectionStore.phoneConnectionContextMenuUiState
            .phoneMenuShowing
        ) {
          phoneConnectionStore.phoneConnectionContextMenuUiState.handleActionMenuItemDialPress(
            phoneConnectionStore.phoneConnectionContextMenuUiState
              .phoneMenuItem,
          );
        } else if (
          this.currentView.index === bluetoothStore.bluetoothDeviceList.length
        ) {
          phoneConnectionStore.handleAddNewPhoneDialPress();
          return;
        } else if (!phoneConnectionStore.phoneConnectionModal) {
          phoneConnectionStore.handleSelectPhoneDialPress();
        }
        break;
      case OptionsMenuItemId.PHONE_CALLS:
        this.phoneCallsUiState.handleDialPress();
        break;
      case MainMenuItemId.TIPS:
        this.tipsOnDemandUiState.handleDialPress();
        break;
      default:
        if (this.highlightedItem) {
          this.submenuUiState.handleSubmenuItemDialPressed(
            this.highlightedItem,
          );
        }
    }

    overlayController.showSettings();
  }

  handleDialLongPress() {
    const { phoneConnectionStore } = this.rootStore;

    switch (this.currentView.id) {
      case MainMenuItemId.PHONE_CONNECTION:
        phoneConnectionStore.handleItemDialLongPress();
        break;
      default:
        break;
    }
  }

  handleDialRight() {
    const { overlayController, phoneConnectionStore, bluetoothStore } =
      this.rootStore;
    const nextIndex = this.currentView.index + 1;
    overlayController.showSettings();
    if (this.currentIsAirVentInterference) {
      this.rootStore.airVentInterferenceController.handleDialRight();
    } else if (this.currentIsPhoneCalls) {
      this.phoneCallsUiState.handleDialRight();
    } else if (this.currentIsPhoneConnection) {
      if (
        phoneConnectionStore.phoneConnectionModal ===
        PhoneConnectionModalView.FORGET_PHONE_CONFIRM
      ) {
        phoneConnectionStore.setForgetConfirmationIsActive(false);
      } else if (phoneConnectionStore.phoneConnectionModal !== undefined) {
        return;
      } else if (
        phoneConnectionStore.phoneConnectionContextMenuUiState.phoneMenuShowing
      ) {
        phoneConnectionStore.phoneConnectionContextMenuUiState.goToNextItem();
      } else if (nextIndex < bluetoothStore.bluetoothDeviceList.length + 1) {
        this.currentView.index = nextIndex;
      }
    } else if (this.currentIsFactoryReset) {
      this.setFactoryResetConfirmationIsActive(false);
    } else {
      if (this.currentView.rows && nextIndex < this.currentView.rows.length) {
        this.currentView.index = nextIndex;
      }
    }
  }

  handleDialLeft() {
    const { overlayController, phoneConnectionStore } = this.rootStore;
    overlayController.showSettings();
    if (this.currentIsAirVentInterference) {
      this.rootStore.airVentInterferenceController.handleDialLeft();
    } else if (this.currentIsPhoneCalls) {
      this.phoneCallsUiState.handleDialLeft();
    } else if (
      phoneConnectionStore.phoneConnectionModal ===
      PhoneConnectionModalView.FORGET_PHONE_CONFIRM
    ) {
      phoneConnectionStore.setForgetConfirmationIsActive(true);
    } else if (phoneConnectionStore.phoneConnectionModal !== undefined) {
      return;
    } else if (
      phoneConnectionStore.phoneConnectionContextMenuUiState.phoneMenuShowing
    ) {
      phoneConnectionStore.phoneConnectionContextMenuUiState.goToPreviousItem();
    } else if (this.currentIsFactoryReset) {
      this.setFactoryResetConfirmationIsActive(true);
    } else {
      const prevIndex = this.currentView.index - 1;
      if (prevIndex >= 0) {
        this.currentView.index = prevIndex;
      }
    }
  }

  handleBack() {
    const {
      overlayController,
      phoneConnectionStore,
      ubiLogger: { settingsUbiLogger },
    } = this.rootStore;

    if (
      this.currentIsPhoneConnection &&
      phoneConnectionStore.phoneConnectionModal !== undefined
    ) {
      if (
        phoneConnectionStore.phoneConnectionModal ===
        PhoneConnectionModalView.FORGET_PHONE_CONFIRM
      ) {
        settingsUbiLogger.logConfirmForgetBackButton();
        phoneConnectionStore.phoneConnectionContextMenuUiState.setNewMenuIndex(
          0,
        );
      } else {
        phoneConnectionStore.phoneConnectionContextMenuUiState.dismissMenu();
      }
      phoneConnectionStore.dismissModal();
    } else if (
      phoneConnectionStore.phoneConnectionContextMenuUiState.phoneMenuShowing
    ) {
      settingsUbiLogger.logActionMenuBackButton();
      phoneConnectionStore.phoneConnectionContextMenuUiState.dismissMenu();
      this.handleSettingSetNewIndex(0);
    } else if (this.viewStack.length === 1) {
      settingsUbiLogger.logMainMenuBackButton();
      overlayController.resetAndMaybeShowAModal();
      this.reset();
    } else {
      this.logSubmenuBackButton(this.currentView.id);
      this.viewStack.pop();
      this.currentView.rows?.forEach((row) => (row.index = 0));
      if (this.isMainMenu) {
        overlayController.showSettings();
      }
    }
  }

  handleSettingsButtonLongPress() {
    const { hardwareStore, overlayController, ubiLogger } = this.rootStore;
    if (this.isPowerTutorial) {
      ubiLogger.settingsUbiLogger.logPowerOffTutorialSettingsLongPress();
      hardwareStore.powerOff();
    } else {
      overlayController.showStandby();
    }
  }

  handlePresetButtonPressed() {
    this.tipsOnDemandUiState.handlePresetButtonPressed();
  }

  handleMainMenuItemSelected(row: View) {
    const rowDisabled = this.isMainMenuItemDisabled(row.disabledOffline);
    const {
      voiceStore,
      ubiLogger: { settingsUbiLogger },
    } = this.rootStore;

    if (rowDisabled) {
      this.unavailableSettingsBannerUiState.showUnavailableBanner();
    } else {
      if (row.id === MainMenuItemId.MIC) {
        if (voiceStore.isMicMuted) {
          settingsUbiLogger.logMicClickEnable();
        } else {
          settingsUbiLogger.logMicClickDisable();
        }
        voiceStore.toggleMic();
      } else {
        this.logRowClicked(row.id);
        this.gotoView(row);
      }
    }
  }

  logRowClicked = (rowName: string) => {
    const {
      ubiLogger: { settingsUbiLogger },
    } = this.rootStore;
    switch (rowName) {
      case MainMenuItemId.PHONE_CONNECTION:
        settingsUbiLogger.logPhoneConnectionRowClicked();
        break;
      case MainMenuItemId.OPTIONS:
        settingsUbiLogger.logOptionsRowClicked();
        break;
      case MainMenuItemId.TIPS:
        settingsUbiLogger.logTipsOnDemandRowTouch();
        break;
      case MainMenuItemId.ABOUT:
        settingsUbiLogger.logAboutRowClicked();
        break;
      case MainMenuItemId.RESTART:
        settingsUbiLogger.logRestartRowClicked();
        break;
      case OptionsMenuItemId.AIR_VENT_INTERFERENCE:
        settingsUbiLogger.logAirVentInterferenceRowClick();
        break;
      case RestartMenuItemId.RESTART_CONFIRM:
        settingsUbiLogger.logRestartSubmenuRestartConfirmRowClick();
        break;
      case RestartMenuItemId.FACTORY_RESET:
        settingsUbiLogger.logRestartSubmenuFactoryResetRowClick();
        break;
      case OptionsMenuItemId.TIPS_TOGGLE:
        this.logTipsClicked(settingsUbiLogger);
        break;
      case RestartMenuItemId.POWER_OFF_TUTORIAL:
        settingsUbiLogger.logPowerOffOnRowClick();
        break;
      default:
        break;
    }
  };

  private logTipsClicked = (settingsUbiLogger: SettingsUbiLogger) => {
    const {
      npvStore: { tipsUiState },
    } = this.rootStore;
    if (tipsUiState.tipsSettingOn) {
      settingsUbiLogger.logTipsDisabledTouch();
    } else {
      settingsUbiLogger.logTipsEnabledTouch();
    }
  };

  private logTipsDialPress = (settingsUbiLogger: SettingsUbiLogger) => {
    const {
      npvStore: { tipsUiState },
    } = this.rootStore;
    if (tipsUiState.tipsSettingOn) {
      settingsUbiLogger.logTipsDisabledDialPress();
    } else {
      settingsUbiLogger.logTipsEnabledDialPress();
    }
  };

  logRowDialPressed = (rowId: MenuItemId) => {
    const {
      ubiLogger: { settingsUbiLogger },
    } = this.rootStore;
    switch (rowId) {
      case MainMenuItemId.PHONE_CONNECTION:
        settingsUbiLogger.logPhoneConnectionRowDialPressed();
        break;
      case MainMenuItemId.OPTIONS:
        settingsUbiLogger.logOptionsRowDialPressed();
        break;
      case MainMenuItemId.TIPS:
        settingsUbiLogger.logTipsOnDemandRowDialPress();
        break;
      case MainMenuItemId.ABOUT:
        settingsUbiLogger.logAboutRowDialPressed();
        break;
      case MainMenuItemId.RESTART:
        settingsUbiLogger.logRestartRowDialPressed();
        break;
      case OptionsMenuItemId.AIR_VENT_INTERFERENCE:
        settingsUbiLogger.logAirVentInterferenceRowDialPress();
        break;
      case RestartMenuItemId.RESTART_CONFIRM:
        settingsUbiLogger.logRestartSubmenuRestartConfirmRowDialPressed();
        break;
      case RestartMenuItemId.FACTORY_RESET:
        settingsUbiLogger.logRestartSubmenuFactoryResetDialPressed();
        break;
      case RestartMenuItemId.POWER_OFF_TUTORIAL:
        settingsUbiLogger.logPowerOffOnRowDialPressed();
        break;
      default:
        break;
    }
  };

  logSubmenuBackButton = (fromSubmenuId: MenuItemId) => {
    const {
      ubiLogger: { settingsUbiLogger },
    } = this.rootStore;
    switch (fromSubmenuId) {
      case MainMenuItemId.PHONE_CONNECTION:
        settingsUbiLogger.logPhoneConnectionBackButton();
        break;
      case MainMenuItemId.OPTIONS:
        settingsUbiLogger.logOptionsBackButton();
        break;
      case MainMenuItemId.TIPS:
        settingsUbiLogger.logTipsOnDemandBackButton();
        break;
      case MainMenuItemId.ABOUT:
        settingsUbiLogger.logAboutBackButton();
        break;
      case MainMenuItemId.RESTART:
        settingsUbiLogger.logRestartBackButton();
        break;
      case OptionsMenuItemId.AIR_VENT_INTERFERENCE:
        settingsUbiLogger.logAirVentInterferenceBackButton();
        break;
      case OptionsMenuItemId.DISPLAY_AND_BRIGHTNESS:
        settingsUbiLogger.logNightModeBackButton();
        break;
      case RestartMenuItemId.RESTART_CONFIRM:
        settingsUbiLogger.logRestartConfirmBackButton();
        break;
      case RestartMenuItemId.FACTORY_RESET:
        settingsUbiLogger.logFactoryResetBackButton();
        break;
      case RestartMenuItemId.POWER_OFF_TUTORIAL:
        settingsUbiLogger.logPowerOffTutorialBackButton();
        break;
      default:
        break;
    }
  };

  handleFactoryResetClicked = () => {
    this.rootStore.ubiLogger.settingsUbiLogger.logFactoryResetCancelButtonClick();
    this.handleBack();
  };

  handleStandbyCancelClicked = () => {
    // TODO: jimmywa: Add Ubi logging.
    this.handleBack();
  };

  resetSubCategoryIndexes(): void {
    this.settings.rows?.forEach((row) => (row.index = 0));
  }

  handleSettingSetNewIndex(index: number): void {
    this.rootStore.overlayController.showSettings();
    this.currentView.index = index;
  }

  setFactoryResetConfirmationIsActive(isActive: boolean) {
    this.factoryResetConfirmationIsActive = isActive;
  }

  filterOutNonVisible(items: View[]): View[] {
    const visibleItems: View[] = [];
    items.forEach((item) => {
      if (item.visible()) {
        // Need to copy original object to not change this.settings
        const i = { ...item };
        visibleItems.push(i);
        if (i.rows) {
          i.rows = this.filterOutNonVisible(i.rows);
        }
      }
    });
    return visibleItems;
  }

  showOnlyAirVentInterference() {
    this.viewStack = [this.airVentInterferenceView];
  }

  reset() {
    this.viewStack = this.filterOutNonVisible([this.settings]);
    this.currentView.index = 0;
  }
}

export default SettingsStore;

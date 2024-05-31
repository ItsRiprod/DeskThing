import {
  CarSettingsCarthingosEventFactory,
  createCarSettingsCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-settings-carthingos/CarSettingsCarthingosEventFactory';
import UbiLogger from 'eventhandler/UbiLogger';
import {
  MainMenuItemId,
  OptionsMenuItemId,
  RestartMenuItemId,
} from 'store/SettingsStore';

class SettingsUbiLogger {
  ubiLogger: UbiLogger;
  carSettingsCarthingosEventFactory: CarSettingsCarthingosEventFactory;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.carSettingsCarthingosEventFactory =
      createCarSettingsCarthingosEventFactory();
  }

  /*
   * MAIN MENU
   */

  logMainMenuImpression = () => {
    const event = this.carSettingsCarthingosEventFactory.impression();
    this.ubiLogger.logImpression(event);
  };

  logSettingsButtonShow = () => {
    const event = this.carSettingsCarthingosEventFactory
      .hardwareSettingsButtonFactory()
      .keyStrokeUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logSettingsButtonHide = () => {
    const event = this.carSettingsCarthingosEventFactory
      .hardwareSettingsButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logMainMenuBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logMicClickEnable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .microphoneRowFactory()
      .hitSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logMicClickDisable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .microphoneRowFactory()
      .hitSettingDisable();
    this.ubiLogger.logInteraction(event);
  };

  logMicDialPressedEnable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .microphoneRowFactory()
      .keyStrokeSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logMicDialPressedDisable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .microphoneRowFactory()
      .keyStrokeSettingDisable();
    this.ubiLogger.logInteraction(event);
  };

  logPhoneConnectionRowClicked = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .hitUiNavigate({
        destination: MainMenuItemId.PHONE_CONNECTION,
      });
    this.ubiLogger.logInteraction(event);
  };

  logPhoneConnectionRowDialPressed = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .keyStrokeUiNavigate({
        destination: MainMenuItemId.PHONE_CONNECTION,
      });
    this.ubiLogger.logInteraction(event);
  };

  logAboutRowClicked = () => {
    const event = this.carSettingsCarthingosEventFactory
      .aboutRowFactory()
      .hitUiNavigate({
        destination: MainMenuItemId.ABOUT,
      });
    this.ubiLogger.logInteraction(event);
  };

  logAboutRowDialPressed = () => {
    const event = this.carSettingsCarthingosEventFactory
      .aboutRowFactory()
      .keyStrokeUiNavigate({
        destination: MainMenuItemId.ABOUT,
      });
    this.ubiLogger.logInteraction(event);
  };

  logOptionsRowClicked = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .hitUiNavigate({
        destination: MainMenuItemId.OPTIONS,
      });
    this.ubiLogger.logInteraction(event);
  };

  logOptionsRowDialPressed = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .keyStrokeUiNavigate({
        destination: MainMenuItemId.OPTIONS,
      });
    this.ubiLogger.logInteraction(event);
  };

  logRestartRowClicked = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .hitUiNavigate({
        destination: MainMenuItemId.RESTART,
      });
    this.ubiLogger.logInteraction(event);
  };

  logRestartRowDialPressed = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .keyStrokeUiNavigate({
        destination: MainMenuItemId.RESTART,
      });
    this.ubiLogger.logInteraction(event);
  };

  logUnavailableSettingBannerImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .unavailableSettingBannerFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  /*
   * PHONE CONNECTION MENU
   */

  logPhoneConnectionViewImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logPhoneConnectionBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logPhoneDialLongPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .longHitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logPhoneActionsClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .hitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logActionMenuImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logActionMenuBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logActionMenuForgetRowClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .forgetRowFactory()
      .hitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logActionMenuForgetRowDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .forgetRowFactory()
      .keyStrokeUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logConfirmForgetImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .forgetRowFactory()
      .forgetConfirmViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logConfirmForgetBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .forgetRowFactory()
      .forgetConfirmViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logForgetConfirmClick = (remoteDeviceId: string) => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .forgetRowFactory()
      .forgetConfirmViewFactory()
      .forgetConfirmButtonFactory()
      .hitDisconnectFromRemoteDevice({
        remoteDeviceId,
      });
    this.ubiLogger.logInteraction(event);
  };

  logForgetConfirmDialPress = (remoteDeviceId: string) => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .forgetRowFactory()
      .forgetConfirmViewFactory()
      .forgetConfirmButtonFactory()
      .keyStrokeDisconnectFromRemoteDevice({
        remoteDeviceId,
      });
    this.ubiLogger.logInteraction(event);
  };

  logForgetCancelClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .forgetRowFactory()
      .forgetConfirmViewFactory()
      .cancelButtonFactory()
      .hitUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logForgetCancelDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .actionMenuButtonFactory()
      .actionMenuFactory()
      .forgetRowFactory()
      .forgetConfirmViewFactory()
      .cancelButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logPhoneConnectionNewPhoneClick = (position: number) => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .addNewPhoneRowFactory({ position })
      .hitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logPhoneConnectionNewPhoneDialPressed = (position: number) => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .addNewPhoneRowFactory({ position })
      .keyStrokeUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logPhoneConnectionAddNewPhoneDialog = (index: number) => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .addNewPhoneRowFactory({ position: index })
      .addNewPhoneDialogFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logPhoneConnectionSelectPhoneInProgressDialog = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .selectPhoneProgressDialogFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logPhoneConnectionSelectPhoneSuccessDialog = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .selectPhoneSuccessDialogFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logPhoneConnectionSelectPhoneFailureDialog = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .existingPhoneRowFactory()
      .selectPhoneFailureDialogFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logPhoneConnectionLoginRequiredDialog = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .loginRequiredDialogFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logPhoneConnectionPremiumRequiredDialog = () => {
    const event = this.carSettingsCarthingosEventFactory
      .phoneConnectionRowFactory()
      .phoneConnectionViewFactory()
      .premiumRequiredDialogFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  /*
   * OPTIONS
   */

  logOptionsViewImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logOptionsBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logAirVentInterferenceRowClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .airVentInterferenceRowFactory()
      .hitUiNavigate({
        destination: OptionsMenuItemId.AIR_VENT_INTERFERENCE,
      });
    this.ubiLogger.logInteraction(event);
  };

  logAirVentInterferenceRowDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .airVentInterferenceRowFactory()
      .keyStrokeUiNavigate({
        destination: OptionsMenuItemId.AIR_VENT_INTERFERENCE,
      });
    this.ubiLogger.logInteraction(event);
  };

  logDisplayAndBrightnessRowClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .displayAndBrightnessRowFactory()
      .hitUiNavigate({
        destination: OptionsMenuItemId.DISPLAY_AND_BRIGHTNESS,
      });
    this.ubiLogger.logInteraction(event);
  };

  logDisplayAndBrightnessRowDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .displayAndBrightnessRowFactory()
      .keyStrokeUiNavigate({
        destination: OptionsMenuItemId.DISPLAY_AND_BRIGHTNESS,
      });
    this.ubiLogger.logInteraction(event);
  };

  /*
   * OPTIONS - AIR VENT INTERFERENCE
   */

  logAirVentInterferenceViewImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .airVentInterferenceRowFactory()
      .airVentInterferenceViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logAirVentInterferenceBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .airVentInterferenceRowFactory()
      .airVentInterferenceViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logAirVentInterferenceClickEnable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .airVentInterferenceRowFactory()
      .airVentInterferenceViewFactory()
      .allowNotificationsToggleFactory()
      .hitSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logAirVentInterferenceClickDisable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .airVentInterferenceRowFactory()
      .airVentInterferenceViewFactory()
      .allowNotificationsToggleFactory()
      .hitSettingDisable();
    this.ubiLogger.logInteraction(event);
  };

  logAirVentInterferenceDialPressedEnable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .airVentInterferenceRowFactory()
      .airVentInterferenceViewFactory()
      .allowNotificationsToggleFactory()
      .keyStrokeSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logAirVentInterferenceDialPressedDisable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .airVentInterferenceRowFactory()
      .airVentInterferenceViewFactory()
      .allowNotificationsToggleFactory()
      .keyStrokeSettingDisable();
    this.ubiLogger.logInteraction(event);
  };

  /*
   * OPTIONS - Display and brightness / Night mode
   */

  logNightModeViewImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .displayAndBrightnessRowFactory()
      .nightModeViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logNightModeBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .displayAndBrightnessRowFactory()
      .nightModeViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logNightModeClickEnable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .displayAndBrightnessRowFactory()
      .nightModeViewFactory()
      .allowNightModeToggleFactory()
      .hitSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logNightModeClickDisable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .displayAndBrightnessRowFactory()
      .nightModeViewFactory()
      .allowNightModeToggleFactory()
      .hitSettingDisable();
    this.ubiLogger.logInteraction(event);
  };

  logNightModeDialPressedEnable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .displayAndBrightnessRowFactory()
      .nightModeViewFactory()
      .allowNightModeToggleFactory()
      .keyStrokeSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logNightModeDialPressedDisable = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .displayAndBrightnessRowFactory()
      .nightModeViewFactory()
      .allowNightModeToggleFactory()
      .keyStrokeSettingDisable();
    this.ubiLogger.logInteraction(event);
  };

  /*
   * TIPS
   */

  logTipsOnDemandRowDialPress = () =>
    this.ubiLogger.logInteraction(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .keyStrokeUiReveal(),
    );

  logTipsOnDemandRowTouch = () =>
    this.ubiLogger.logInteraction(
      this.carSettingsCarthingosEventFactory.tipsRowFactory().hitUiReveal(),
    );

  logTipsOnDemandImpression = (totalDurationInView: number) =>
    this.ubiLogger.logImpression(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .tipsOnDemandViewFactory({ position: totalDurationInView })
        .impression(),
    );

  logTipOnDemandImpression = (identifier: number, duration: number) =>
    this.ubiLogger.logImpression(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .tipsOnDemandViewFactory({ position: -1 })
        .tipFactory({
          identifier: String(identifier),
          reason: String(duration),
        })
        .impression(),
    );

  logTipsOnDemandNextButtonClick = () =>
    this.ubiLogger.logInteraction(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .nextButtonFactory()
        .hitShowTooltip(),
    );

  logTipsOnDemandVoiceInteraction = (tipId: number) =>
    this.ubiLogger.logInteraction(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .tipsOnDemandViewFactory({ position: -1 })
        .speechPlaceholderAction({ actionId: String(tipId) }),
    );

  logTipsOnDemandPresetsButtonClick = (tipId: number) =>
    this.ubiLogger.logInteraction(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .presetButtonFactory({ identifier: String(tipId) })
        .hitUiReveal(),
    );

  logTipsOnDemandBackButton = () =>
    this.ubiLogger.logInteraction(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .backButtonFactory()
        .keyStrokeUiHide(),
    );

  logTipsOnDemandErrorImpression = () =>
    this.ubiLogger.logImpression(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .tipsErrorViewFactory()
        .impression(),
    );

  logTipsOnDemandErrorConfirmation = () =>
    this.ubiLogger.logInteraction(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .tipsErrorViewFactory()
        .okButtonFactory()
        .hitUiHide(),
    );

  logTipsOnDemandErrorConfirmationDialPress = () =>
    this.ubiLogger.logInteraction(
      this.carSettingsCarthingosEventFactory
        .tipsRowFactory()
        .tipsErrorViewFactory()
        .okButtonFactory()
        .keyStrokeUiHide(),
    );

  /*
   * ABOUT MENU
   */

  logAboutViewImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .aboutRowFactory()
      .aboutViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logAboutBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .aboutRowFactory()
      .aboutViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logThirdPartyLicenseImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .aboutRowFactory()
      .aboutViewFactory()
      .thirdPartySoftwareRowFactory()
      .thirdPartySoftwareViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  /*
   * RESTART MENU
   */

  logRestartSubmenuViewImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logRestartBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logRestartSubmenuRestartConfirmRowClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .restartSubmenuRowFactory()
      .hitUiNavigate({
        destination: RestartMenuItemId.RESTART_CONFIRM,
      });
    this.ubiLogger.logInteraction(event);
  };

  logRestartSubmenuRestartConfirmRowDialPressed = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .restartSubmenuRowFactory()
      .keyStrokeUiNavigate({
        destination: RestartMenuItemId.RESTART_CONFIRM,
      });
    this.ubiLogger.logInteraction(event);
  };

  logRestartSubmenuFactoryResetRowClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .factoryResetRowFactory()
      .hitUiNavigate({
        destination: RestartMenuItemId.FACTORY_RESET,
      });
    this.ubiLogger.logInteraction(event);
  };

  logRestartSubmenuFactoryResetDialPressed = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .factoryResetRowFactory()
      .keyStrokeUiNavigate({
        destination: RestartMenuItemId.FACTORY_RESET,
      });
    this.ubiLogger.logInteraction(event);
  };

  logPowerOffOnRowDialPressed = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .powerOffOnRowFactory()
      .keyStrokeUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logPowerOffOnRowClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .powerOffOnRowFactory()
      .hitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  /*
   * RESTART MENU - CONFIRM RESTART
   */

  logRestartConfirmDialogImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .restartSubmenuRowFactory()
      .restartConfirmViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logRestartConfirmBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .restartSubmenuRowFactory()
      .restartConfirmViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logRestartConfirmButtonClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .restartSubmenuRowFactory()
      .restartConfirmViewFactory()
      .restartConfirmButtonFactory()
      .hitReboot();
    this.ubiLogger.logInteraction(event);
  };

  logRestartConfirmButtonDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .restartSubmenuRowFactory()
      .restartConfirmViewFactory()
      .restartConfirmButtonFactory()
      .keyStrokeReboot();
    this.ubiLogger.logInteraction(event);
  };

  /*
   * RESTART MENU - FACTORY RESET - POWER TUTORIAL
   */

  logPowerOffTutorialImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .powerOffOnRowFactory()
      .powerOnOffInstructionViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logPowerOffTutorialSettingsLongPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .powerOffOnRowFactory()
      .powerOnOffInstructionViewFactory()
      .settingsLongPressFactory()
      .longHitPowerOff();
    this.ubiLogger.logInteraction(event);
  };

  logPowerOffTutorialBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .powerOffOnRowFactory()
      .powerOnOffInstructionViewFactory()
      .hardwareBackButtonFactory()
      .hitUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logFactoryResetDialogImpression = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .factoryResetRowFactory()
      .factoryResetConfirmViewFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logFactoryResetBackButton = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .factoryResetRowFactory()
      .factoryResetConfirmViewFactory()
      .hardwareBackButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logFactoryResetConfirmButtonClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .factoryResetRowFactory()
      .factoryResetConfirmViewFactory()
      .factoryResetConfirmButtonFactory()
      .hitFactoryReset();
    this.ubiLogger.logInteraction(event);
  };

  logFactoryResetConfirmButtonDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .factoryResetRowFactory()
      .factoryResetConfirmViewFactory()
      .factoryResetConfirmButtonFactory()
      .keyStrokeFactoryReset();
    this.ubiLogger.logInteraction(event);
  };

  logFactoryResetCancelButtonClick = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .factoryResetRowFactory()
      .factoryResetConfirmViewFactory()
      .cancelButtonFactory()
      .hitUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logFactoryResetCancelButtonDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .restartRowFactory()
      .restartSubmenuViewFactory()
      .factoryResetRowFactory()
      .factoryResetConfirmViewFactory()
      .cancelButtonFactory()
      .hitUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logTipsEnabledDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .tipsRowFactory()
      .keyStrokeSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logTipsDisabledDialPress = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .tipsRowFactory()
      .keyStrokeSettingDisable();
    this.ubiLogger.logInteraction(event);
  };

  logTipsEnabledTouch = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .tipsRowFactory()
      .hitSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logTipsDisabledTouch = () => {
    const event = this.carSettingsCarthingosEventFactory
      .optionsRowFactory()
      .optionsViewFactory()
      .tipsRowFactory()
      .hitSettingDisable();
    this.ubiLogger.logInteraction(event);
  };
}

export default SettingsUbiLogger;

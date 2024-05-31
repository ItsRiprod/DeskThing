import { makeAutoObservable } from 'mobx';
import TipsUiState from 'component/Npv/Tips/TipsUiState';
import SettingsStore, {
  AboutMenuItemId,
  OptionsMenuItemId,
  View,
} from 'store/SettingsStore';
import PhoneCallController from 'component/PhoneCall/PhoneCallController';
import VersionStatusStore from 'store/VersionStatusStore';

export type SubmenuUiState = ReturnType<typeof createSubmenuUiState>;

type AboutValues = {
  serial: string;
  app_version: string;
  os_version: string;
  country: 'Sweden';
  model_name: string;
  fcc_id: string;
  ic_id: string;
  ic_id_model_name: string;
  fcc_id_model_name: string;
  hvin: string;
};

const createSubmenuUiState = (
  settingsStore: SettingsStore,
  tipsUiState: TipsUiState,
  phoneCallController: PhoneCallController,
  versionStatusStore: VersionStatusStore,
) => {
  return makeAutoObservable(
    {
      isToggleOn(item: View): boolean {
        switch (item.id) {
          case OptionsMenuItemId.TIPS_TOGGLE:
            return tipsUiState.isTipsEnabled;
          case OptionsMenuItemId.PHONE_CALLS_TOGGLE:
            return phoneCallController.isUserEnabled;
          default:
            return false;
        }
      },

      get aboutValues(): AboutValues | undefined {
        const values = versionStatusStore.versionStatus;
        if (!values) {
          return undefined;
        }

        return {
          ...values,
          os_version: values.os_version.replace('-release', ''),
          country: 'Sweden',
          hvin: values.model_name,
          ic_id_model_name: `${values.ic_id}-${values.model_name}`,
          fcc_id_model_name: `${values.fcc_id}-${values.model_name}`,
        };
      },

      getKeyValue(item: View): string {
        if (AboutMenuItemId[item.id]) {
          return this.aboutValues?.[item.id.toLowerCase()] ?? '';
        }
        throw new Error(`Unable to get value of key value for [${item.id}]`);
      },

      handleSubmenuItemClicked(item: View): void {
        settingsStore.logRowClicked(item.id);
        this.handleSubmenuItemSelected(item);
      },

      handleSubmenuItemDialPressed(item: View): void {
        settingsStore.logRowDialPressed(item.id);
        this.handleSubmenuItemSelected(item);
      },

      handleSubmenuItemSelected(item: View): void {
        const { remoteControlStore, permissionsStore } =
          settingsStore.rootStore;
        const onlyOfflineSettings =
          !remoteControlStore.interappConnected ||
          permissionsStore.canUseCarThing === false;
        if (item.disabledOffline && onlyOfflineSettings) {
          this.showUnavailableBanner();
        } else if (item.id === OptionsMenuItemId.TIPS_TOGGLE) {
          tipsUiState.toggleTipsEnabled();
        } else if (item.id === OptionsMenuItemId.PHONE_CALLS_TOGGLE) {
          phoneCallController.toggleIsUserEnabled();
        } else {
          settingsStore.gotoView(item);
        }
      },

      showUnavailableBanner() {
        settingsStore.unavailableSettingsBannerUiState.showUnavailableBanner();
      },
    },
    { handleSubmenuItemClicked: false },
  );
};

export default createSubmenuUiState;

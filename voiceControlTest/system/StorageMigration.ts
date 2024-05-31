import SeedableStorageInterface from 'middleware/SeedableStorageInterface';
import { when } from 'mobx';
import { NIGHT_MODE_USER_ENABLED_KEY } from 'component/NightMode/NightModeController';
import { WIND_NOISE_ALERT_DISMISSED_KEY } from 'component/Npv/WindAlertBanner/WindAlertBannerUiState';
import {
  OLD_TIPS_DISABLED_KEY,
  TIPS_ACTIVE_KEY,
} from 'component/Npv/Tips/TipsUiState';
import { PHONE_CALL_USER_ENABLED_KEY } from 'component/PhoneCall/PhoneCallController';
import { PROMO_HISTORY_LOCAL_STORAGE_KEY } from 'component/Promo/PromoController';
import { WIND_NOISE_ALERT_DISABLED_KEY } from 'store/WindLevelStore';

export const BROWSER_LOCAL_STORAGE_MIGRATED_TO_MW_KEY =
  'browser_storage_migrated_to_mw';

export const migrateFromLocalStorage = (
  newStorage: SeedableStorageInterface,
  newKey: string,
  oldKey: string = newKey,
  oldValueMapper: (val: string) => string = (val: string) => {
    return val;
  },
) => {
  when(
    () => newStorage.seeded,
    () => {
      if (
        newStorage.getItem(BROWSER_LOCAL_STORAGE_MIGRATED_TO_MW_KEY) !==
          'true' &&
        newStorage.getItem(newKey) === null
      ) {
        const old = global.localStorage.getItem(oldKey);
        if (old !== null) {
          const used_value = oldValueMapper(old);
          newStorage.setItem(newKey, used_value);
        }
      }
    },
  );
};

export const migrateAllFromLocalStorage = (
  newStorage: SeedableStorageInterface,
) => {
  migrateFromLocalStorage(newStorage, NIGHT_MODE_USER_ENABLED_KEY);
  migrateFromLocalStorage(newStorage, WIND_NOISE_ALERT_DISMISSED_KEY);
  migrateFromLocalStorage(newStorage, TIPS_ACTIVE_KEY, OLD_TIPS_DISABLED_KEY);
  migrateFromLocalStorage(newStorage, PHONE_CALL_USER_ENABLED_KEY);
  migrateFromLocalStorage(newStorage, PROMO_HISTORY_LOCAL_STORAGE_KEY);
  migrateFromLocalStorage(newStorage, WIND_NOISE_ALERT_DISABLED_KEY);
  when(
    () => newStorage.seeded,
    () => {
      newStorage.setItem(BROWSER_LOCAL_STORAGE_MIGRATED_TO_MW_KEY, 'true');
    },
  );
};

import { makeAutoObservable } from 'mobx';

import HardwareStore from 'store/HardwareStore';
import RemoteConfigStore from 'store/RemoteConfigStore';

export type NightModeUiState = ReturnType<typeof nightModeUiStateFactory>;

const roundToTwoDecimals = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

const nightModeUiStateFactory = (
  hardwareStore: HardwareStore,
  remoteConfigStore: RemoteConfigStore,
) => {
  return makeAutoObservable({
    get appOpacity(): number {
      return roundToTwoDecimals(
        1 -
          (this.nightModeSlope * hardwareStore.ambientLightValue +
            remoteConfigStore.nightModeStrength -
            100) /
            100,
      );
    },

    get nightModeSlope(): number {
      return remoteConfigStore.nightModeSlope / 10;
    },
  });
};

export default nightModeUiStateFactory;

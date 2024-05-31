import { useEffect, useState } from 'react';
import styles from './DisplayAndBrightness.module.scss';
import { observer } from 'mobx-react-lite';
import { OptionsMenuItemId } from 'store/SettingsStore';
import classNames from 'classnames';
import pointerListenersMaker from 'helpers/PointerListeners';
import { useStore } from 'context/store';
import Type from 'component/CarthingUIComponents/Type/Type';
import { greenLight } from 'style/Variables';

const DisplayAndBrightness = () => {
  const [pressed, setPressed] = useState(false);

  const uiState = useStore().settingsStore.displayAndBrightnessUiState;

  useEffect(() => {
    uiState.logImpression();
  }, [uiState]);

  return (
    <>
      <div className={styles.header}>
        <span
          data-testid={`${OptionsMenuItemId.DISPLAY_AND_BRIGHTNESS}-header`}
        >
          <Type name="altoBold">Display and brightness</Type>
        </span>
      </div>
      <div className={styles.container}>
        <div
          className={classNames(styles.notification, {
            [styles.pressed]: pressed,
          })}
          {...pointerListenersMaker(setPressed)}
          onClick={() => uiState.handleClickToggle()}
        >
          <Type name="canonBold">Night mode</Type>
          <Type
            name="canonBold"
            textColor={uiState.isNightMode && greenLight}
            dataTestId="night-mode-toggle"
          >
            {uiState.isNightMode ? 'On' : 'Off'}
          </Type>
        </div>
        <Type name="celloBook" className={styles.text}>
          With night mode on, your screen should be easier to view in low-light
          conditions.
        </Type>
      </div>
    </>
  );
};

export default observer(DisplayAndBrightness);

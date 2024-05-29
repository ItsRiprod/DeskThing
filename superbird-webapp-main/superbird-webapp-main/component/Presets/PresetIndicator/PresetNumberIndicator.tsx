import { observer } from 'mobx-react-lite';
import styles from 'component/Presets/PresetIndicator/PresetNumberIndicator.module.scss';
import Type from 'component/CarthingUIComponents/Type/Type';
import classNames from 'classnames';
import { useStore } from 'context/store';
import { PresetNumber } from 'store/PresetsDataStore';

type Props = {
  presetNumber: PresetNumber;
};
const PresetNumberIndicator = ({ presetNumber }: Props) => {
  const uiState = useStore().presetsController.presetsUiState;

  const isFocused = uiState.selectedPresetNumber === presetNumber;
  return (
    <div
      data-testid={`preset-indicator-number-${presetNumber}`}
      className={classNames(styles.presetTopWrapper, {
        [styles.active]: isFocused,
      })}
      key={`preset-number-${presetNumber}`}
    >
      <div className={styles.presetIndicator} />

      <div className={styles.presetNumber}>
        <Type name="mestroBold" className={styles.number}>
          {presetNumber}
        </Type>
      </div>
    </div>
  );
};

export default observer(PresetNumberIndicator);

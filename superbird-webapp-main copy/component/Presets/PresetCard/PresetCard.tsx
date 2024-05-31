import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import styles from 'component/Presets/PresetCard/PresetCard.module.scss';
import PresetContent from 'component/Presets/PresetCard/PresetContent';
import PresetPlaceholder from 'component/Presets/PresetCard/PresetPlaceholder';
import { CSSTransition } from 'react-transition-group';
import { useStore } from 'context/store';
import { PresetOrPlaceholderOrUnavailable } from 'component/Presets/PresetsUiState';
import PresetUnavailable from 'component/Presets/PresetCard/PresetUnavailable';

const transitionStyles = {
  appear: styles.appear,
  appearActive: styles.appearActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
};

type Props = {
  preset: PresetOrPlaceholderOrUnavailable;
};

const PresetCard = ({ preset }: Props) => {
  const uiState = useStore().presetsController.presetsUiState;
  const isFocused = uiState.selectedPresetNumber === preset.slot_index;
  return (
    <CSSTransition
      data-testid={`preset-card-${preset.slot_index}`}
      classNames={transitionStyles}
      timeout={1000}
      in={uiState.currentIsPresets}
      appear
      key={`preset-card-${preset.slot_index}`}
    >
      <div
        data-testid={`preset-card-${preset.slot_index}`}
        className={classNames(
          styles.presetCard,
          styles[`presetCard${preset.slot_index}`],
          {
            [styles.active]: isFocused,
          },
        )}
        onClick={() => uiState.handleTapOnPreset(preset.slot_index)}
      >
        {preset.type === 'preset' && <PresetContent preset={preset} />}
        {preset.type === 'placeholder' && (
          <PresetPlaceholder isFocused={isFocused} />
        )}
        {preset.type === 'unavailable' && <PresetUnavailable preset={preset} />}
      </div>
    </CSSTransition>
  );
};
export default observer(PresetCard);

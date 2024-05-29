import { observer } from 'mobx-react-lite';
import LazyImage from 'component/LazyImage/LazyImage';
import styles from 'component/Presets/PresetCard/PresetUnavailable.module.scss';
import Type from 'component/CarthingUIComponents/Type/Type';
import { UnavailableItem } from 'component/Presets/PresetsUiState';
import { useStore } from 'context/store';
import classNames from 'classnames';
import { fromUriToPresetCategoryType } from 'helpers/SpotifyUriUtil';

type Props = {
  preset: UnavailableItem;
};

const PresetUnavailable = ({ preset }: Props) => {
  const uiState = useStore().presetsController.presetsUiState;
  const isFocused = uiState.selectedPresetNumber === preset.slot_index;
  return (
    <>
      <LazyImage
        size={168}
        scale={3}
        uri={preset.context_uri}
        isActive={isFocused}
      />
      <div className={styles.presetUnavailableTitles}>
        <Type
          name="mestroBold"
          className={classNames(styles.title, {
            [styles.active]: isFocused,
          })}
        >
          {fromUriToPresetCategoryType(preset.context_uri)}
        </Type>
        <Type name="mestroBold">unavailable</Type>
      </div>
    </>
  );
};

export default observer(PresetUnavailable);

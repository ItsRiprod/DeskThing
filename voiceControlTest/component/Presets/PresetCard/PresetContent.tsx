import { observer } from 'mobx-react-lite';
import LazyImage from 'component/LazyImage/LazyImage';
import styles from 'component/Presets/PresetCard/PresetContent.module.scss';
import Type from 'component/CarthingUIComponents/Type/Type';
import { isRadioStationURI } from 'helpers/SpotifyUriUtil';
import NowPlaying from 'component/CarthingUIComponents/NowPlaying/NowPlaying';
import { PresetItem } from 'component/Presets/PresetsUiState';
import { useStore } from 'context/store';
import classNames from 'classnames';

type Props = {
  preset: PresetItem;
};

const PresetContent = ({ preset }: Props) => {
  const uiState = useStore().presetsController.presetsUiState;
  const isFocused = uiState.selectedPresetNumber === preset.slot_index;
  return (
    <>
      <LazyImage
        imageId={preset.image_url}
        size={168}
        uri={preset.context_uri}
        isActive={isFocused}
      />
      <div className={styles.presetTitle}>
        <Type
          name="mestroBold"
          className={classNames(styles.title, {
            [styles.active]: isFocused,
          })}
          dataTestId={`preset-${preset.slot_index}-name`}
        >
          {isRadioStationURI(preset.context_uri)
            ? `Radio · ${preset.name}`
            : preset.name}
        </Type>
        {uiState.showNowPlaying(preset.context_uri) ? (
          <NowPlaying playing={uiState.isPlaying} textName="mestroBook" />
        ) : (
          preset.description && (
            <Type name="mestroBook" className={styles.subtitle}>
              {preset.description}
            </Type>
          )
        )}
      </div>
    </>
  );
};

export default observer(PresetContent);

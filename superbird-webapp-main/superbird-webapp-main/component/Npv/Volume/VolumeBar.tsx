import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import styles from './VolumeBar.module.scss';

const VolumeBar = () => {
  const uiState = useStore().npvStore.volumeUiState;
  const { colorChannels, isPlayingSpotify } = uiState;

  return (
    <div
      className={styles.volumeBar}
      style={
        isPlayingSpotify
          ? {
              background: `rgb(${colorChannels.join(',')})`,
            }
          : undefined
      }
    >
      <span
        className={styles.volumeLevelFill}
        style={{
          width: `${uiState.displayVolume * 100}%`,
        }}
      />
    </div>
  );
};

export default observer(VolumeBar);

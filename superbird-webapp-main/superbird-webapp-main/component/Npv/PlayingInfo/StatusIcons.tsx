import {
  IconMute32,
  IconRepeat32,
  IconRepeatOne32,
  IconWind32,
} from 'component/CarthingUIComponents';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import styles from './StatusIcons.module.scss';

const StatusIcons = () => {
  const uiState = useStore().npvStore.playingInfoUiState;

  return (
    <div className={styles.statusIcons}>
      {uiState.showWindLevelIcon && (
        <div data-testid="wind-icon">
          <IconWind32 />
        </div>
      )}
      {uiState.isPlayingSpotify && uiState.onRepeat && (
        <div data-testid="repeat-icon">
          <IconRepeat32 />
        </div>
      )}
      {uiState.isPlayingSpotify && uiState.onRepeatOnce && (
        <div data-testid="repeat-icon-once">
          <IconRepeatOne32 />
        </div>
      )}
      {uiState.isMicMuted && (
        <div data-testid="muted-icon" onClick={uiState.showSettings}>
          <IconMute32 />
        </div>
      )}
    </div>
  );
};

export default observer(StatusIcons);

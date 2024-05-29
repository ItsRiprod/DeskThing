import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import styles from './PlayingInfoHeader.module.scss';

const PlayingInfoHeader = () => {
  const uiState = useStore().npvStore.playingInfoUiState;

  return (
    <div className={styles.header}>
      <div
        className={styles.contextTitle}
        data-testid="context-title"
        onClick={uiState.handlePlayingInfoHeaderClick}
      >
        {uiState.contextHeaderTitle}
      </div>
    </div>
  );
};

export default observer(PlayingInfoHeader);

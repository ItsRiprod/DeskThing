import type { TrackItem } from 'component/Tracklist/TracklistUiState';
import { RootStoreProps } from 'store/RootStore';
import withStore from 'hocs/withStore';
import styles from './ProgressBar.module.scss';
import { observer } from 'mobx-react-lite';

type PlayingBarProps = RootStoreProps & {
  item: TrackItem;
  isCurrent: boolean;
};

const ProgressBar = (props: PlayingBarProps) => {
  const { item, isCurrent } = props;
  const { uri, metadata } = item;
  if (isCurrent) {
    return (
      <div data-testid={`progress-bar-${uri}`} className={styles.progressBar}>
        <div
          className={styles.progress}
          style={{ width: `${props.store.timerStore.trackPlayedPercent}%` }}
        />
      </div>
    );
  }

  if (metadata) {
    const { duration_ms, time_left_ms } = metadata;
    const showPausedProgressBar = duration_ms !== time_left_ms;
    if (time_left_ms && duration_ms && showPausedProgressBar) {
      return (
        <div data-testid={`progress-bar-${uri}`} className={styles.progressBar}>
          <div
            className={styles.progress}
            style={{ width: `${100 - (time_left_ms / duration_ms) * 100}%` }}
          />
        </div>
      );
    }
  }
  return null;
};

export default withStore(observer(ProgressBar));

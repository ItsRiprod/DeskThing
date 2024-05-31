import { observer } from 'mobx-react-lite';
import styles from './TracklistHeader.module.scss';
import classNames from 'classnames';
import { get } from 'mobx';
import { useStore } from 'context/store';
import TracklistHeaderDetails from 'component/Tracklist/TracklistHeaderDetails';
import TracklistHeaderActions from 'component/Tracklist/TracklistHeaderActions';

const TracklistHeader = () => {
  const uiState = useStore().tracklistStore.tracklistUiState;

  const getHeaderBackground = () => {
    const colorChannels = get(
      uiState.colors,
      uiState.currentPlayingImageId,
    ) || [0, 0, 0];
    return `linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.84) 100%), rgb(${colorChannels.join(
      ',',
    )})`;
  };

  return (
    <div
      className={styles.headerWrapper}
      style={{
        background: getHeaderBackground(),
      }}
    >
      <div
        className={classNames(styles.header, {
          [styles.smallHeader]: uiState.smallHeader,
        })}
      >
        <TracklistHeaderDetails />
        {uiState.shouldShowHeart && <TracklistHeaderActions />}
      </div>
    </div>
  );
};

export default observer(TracklistHeader);

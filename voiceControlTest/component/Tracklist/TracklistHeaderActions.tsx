import classNames from 'classnames';
import { IconHeart48, IconHeartActive48 } from 'component/CarthingUIComponents';
import { useStore } from 'context/store';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import styles from './TracklistHeaderActions.module.scss';

const TracklistHeaderActions = () => {
  const uiState = useStore().tracklistStore.tracklistUiState;

  const handleUnlikeClick = action(() => {
    uiState.logRemoveLike();
    uiState.setIsSaved(false);
  });

  const handleLikeClick = action(() => {
    uiState.logLike();
    uiState.setIsSaved(true);
  });

  return (
    <div
      className={classNames(styles.actions, {
        [styles.smallHeader]: uiState.smallHeader,
      })}
      onClick={uiState.isLiked ? handleUnlikeClick : handleLikeClick}
    >
      {uiState.isLiked ? (
        <div data-testid="liked">
          <IconHeartActive48 />
        </div>
      ) : (
        <div data-testid="not-liked">
          <IconHeart48 />
        </div>
      )}
    </div>
  );
};

export default observer(TracklistHeaderActions);

import { IconHeart48, IconHeartActive48 } from 'component/CarthingUIComponents';
import { NpvIcon } from 'component/Npv/ControlButtons/Controls';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import ControlButton from './ControlButton';

const LikeTrack = () => {
  const uiState = useStore().npvStore.controlButtonsUiState;
  const { playerStore } = useStore();
  return (
    <>
      {uiState.isSaved ? (
        <ControlButton
          id={NpvIcon.UNLIKE}
          onClick={uiState.handleUnlikeClick}
          isDisabled={!playerStore.canUnlike}
        >
          <IconHeartActive48 />
        </ControlButton>
      ) : (
        <ControlButton
          id={NpvIcon.LIKE}
          onClick={uiState.handleLikeClick}
          isDisabled={!playerStore.canLike}
        >
          <IconHeart48 />
        </ControlButton>
      )}
    </>
  );
};

export default observer(LikeTrack);

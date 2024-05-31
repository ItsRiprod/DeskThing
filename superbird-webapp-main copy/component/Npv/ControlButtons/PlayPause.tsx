import { IconPause48, IconPlay48 } from 'component/CarthingUIComponents';
import ControlButton from 'component/Npv/ControlButtons/ControlButton';
import { NpvIcon } from 'component/Npv/ControlButtons/Controls';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';

const PlayPause = () => {
  const uiState = useStore().npvStore.controlButtonsUiState;
  const { playerStore } = useStore();
  return (
    <>
      {uiState.isPlaying ? (
        <ControlButton
          id={NpvIcon.PAUSE}
          onClick={uiState.handlePauseClick}
          isDisabled={!playerStore.canPause}
        >
          <div data-testid="pause-icon">
            <IconPause48 />
          </div>
        </ControlButton>
      ) : (
        <ControlButton
          id={NpvIcon.PLAY}
          onClick={uiState.handlePlayClick}
          isDisabled={!playerStore.canPlay}
        >
          <div data-testid="playing-icon">
            <IconPlay48 />
          </div>
        </ControlButton>
      )}
    </>
  );
};

export default observer(PlayPause);

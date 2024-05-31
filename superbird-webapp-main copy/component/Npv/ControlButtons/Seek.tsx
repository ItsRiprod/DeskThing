import {
  IconSeek15Back48,
  IconSeek15Foward48,
} from 'component/CarthingUIComponents';
import ControlButton from 'component/Npv/ControlButtons/ControlButton';
import { SkipDirection } from 'component/Npv/ControlButtons/ControlButtonsUiState';
import { NpvIcon } from 'component/Npv/ControlButtons/Controls';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';

type Props = {
  direction: SkipDirection;
};

const Seek = ({ direction }: Props) => {
  const uiState = useStore().npvStore.controlButtonsUiState;

  return (
    <>
      {direction === SkipDirection.BACK ? (
        <ControlButton
          id={NpvIcon.SEEK_BACK_15}
          onClick={uiState.handleSeekBackClick}
          isDisabled={!uiState.canSeek}
        >
          <IconSeek15Back48 />
        </ControlButton>
      ) : (
        <ControlButton
          id={NpvIcon.SEEK_FORWARD_15}
          onClick={uiState.handleSeekForwardClick}
          isDisabled={!uiState.canSeek}
        >
          <IconSeek15Foward48 />
        </ControlButton>
      )}
    </>
  );
};

export default observer(Seek);

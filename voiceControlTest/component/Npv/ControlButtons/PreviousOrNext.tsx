import {
  IconSkipBack48,
  IconSkipForward48,
} from 'component/CarthingUIComponents';
import { SkipDirection } from 'component/Npv/ControlButtons/ControlButtonsUiState';
import { NpvIcon } from 'component/Npv/ControlButtons/Controls';
import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';
import ControlButton from './ControlButton';

type Props = {
  direction: SkipDirection;
};

const PreviousOrNext = ({ direction }: Props) => {
  const uiState = useStore().npvStore.controlButtonsUiState;
  const { playerStore } = useStore();
  return (
    <>
      {direction === SkipDirection.BACK ? (
        <ControlButton
          id={NpvIcon.SKIP_PREV}
          onClick={uiState.handleSkipPrevClick}
          isDisabled={!playerStore.canSkipPrev}
        >
          <IconSkipBack48 />
        </ControlButton>
      ) : (
        <ControlButton
          id={NpvIcon.SKIP_NEXT}
          onClick={uiState.handleSkipNextClick}
          isDisabled={!playerStore.canSkipNext}
        >
          <IconSkipForward48 />
        </ControlButton>
      )}
    </>
  );
};

export default observer(PreviousOrNext);

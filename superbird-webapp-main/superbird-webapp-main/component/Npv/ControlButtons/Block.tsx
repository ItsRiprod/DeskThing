import ControlButton from 'component/Npv/ControlButtons/ControlButton';
import { NpvIcon } from 'component/Npv/ControlButtons/Controls';
import { IconBlock } from 'component/CarthingUIComponents/';
import { useStore } from 'context/store';

const Block = () => {
  const uiState = useStore().npvStore.controlButtonsUiState;

  return (
    <ControlButton id={NpvIcon.BLOCK} onClick={uiState.handleBlockClick}>
      <IconBlock />
    </ControlButton>
  );
};

export default Block;

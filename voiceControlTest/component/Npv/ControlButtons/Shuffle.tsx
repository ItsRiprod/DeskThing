import {
  IconShuffle48,
  IconShuffleActive48,
} from 'component/CarthingUIComponents';
import ControlButton from 'component/Npv/ControlButtons/ControlButton';
import { NpvIcon } from 'component/Npv/ControlButtons/Controls';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import styles from './Controls.module.scss';

const Shuffle = () => {
  const uiState = useStore().npvStore.controlButtonsUiState;
  const { playerStore } = useStore();
  return (
    <>
      {uiState.isShuffled ? (
        <ControlButton
          id={NpvIcon.UNSHUFFLE}
          onClick={uiState.handleUnshuffleClick}
          isDisabled={!playerStore.canToggleShuffle}
        >
          <div className={styles.iconShuffleActive}>
            <IconShuffleActive48 />
          </div>
        </ControlButton>
      ) : (
        <ControlButton
          id={NpvIcon.SHUFFLE}
          onClick={uiState.handleShuffleClick}
          isDisabled={!playerStore.canToggleShuffle}
        >
          <IconShuffle48 />
        </ControlButton>
      )}
    </>
  );
};

export default observer(Shuffle);

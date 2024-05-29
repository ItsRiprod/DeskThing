import { IconAddAlt48, IconCheckAlt } from 'component/CarthingUIComponents';
import { NpvIcon } from 'component/Npv/ControlButtons/Controls';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import ControlButton from './ControlButton';

const SaveEpisode = () => {
  const uiState = useStore().npvStore.controlButtonsUiState;

  return (
    <>
      {uiState.isSaved ? (
        <ControlButton
          id={NpvIcon.REMOVE_FROM_EPISODES}
          onClick={uiState.handleRemoveFromSavedEpisodesClick}
        >
          <IconCheckAlt iconSize={48} />
        </ControlButton>
      ) : (
        <ControlButton
          id={NpvIcon.ADD_TO_EPISODES}
          onClick={uiState.handleAddToSavedEpisodesClick}
          isDisabled={uiState.isPlayingAd}
        >
          <IconAddAlt48 />
        </ControlButton>
      )}
    </>
  );
};

export default observer(SaveEpisode);

import { useStore } from 'context/store';
import styles from './Scrubbing.module.scss';
import { observer } from 'mobx-react-lite';
import ScrubbingBar from 'component/Npv/Scrubbing/ScrubbingBar';

const Scrubbing = () => {
  const uiState = useStore().npvStore.scrubbingUiState;

  return (
    <>
      {uiState.isScrubbingEnabled && (
        <div
          data-testid="scrubbing-bar-touch-area"
          className={styles.scrubbingClickArea}
          onClick={uiState.handleScrubberClick}
        />
      )}
      <ScrubbingBar />
    </>
  );
};

export default observer(Scrubbing);

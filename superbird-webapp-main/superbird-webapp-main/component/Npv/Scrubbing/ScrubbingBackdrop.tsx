import Overlay, { FROM } from 'component/Overlays/Overlay';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import './ScrubbingBackdrop.module.scss';
import styles from './ScrubbingBackdrop.module.scss';

const ProgressBackdrop = () => {
  const uiState = useStore().npvStore.scrubbingUiState;

  return (
    <Overlay show={uiState.isScrubbing} appear={FROM.FADE_IN}>
      <div
        data-testid="scrubbing-backdrop-area"
        className={styles.scrubbingBackdrop}
        onClick={uiState.stopScrubbing}
        onTouchMove={uiState.handleOnTouchMove}
        onTouchEnd={uiState.handleScrubbingBackdropOnTouchEnd}
      >
        <div className={styles.time}>
          <span className={styles.start}>{uiState.trackPlayedTime}</span>
          <span className={styles.end}>- {uiState.trackLeftTime}</span>
        </div>
      </div>
    </Overlay>
  );
};

export default observer(ProgressBackdrop);

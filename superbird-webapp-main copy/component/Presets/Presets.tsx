import { useEffect } from 'react';
import styles from './Presets.module.scss';
import { SwipeEventData, useSwipeable } from 'react-swipeable';
import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';
import { PresetOrPlaceholderOrUnavailable } from 'component/Presets/PresetsUiState';
import { PRESET_NUMBERS } from 'store/PresetsDataStore';
import PresetNumberIndicator from 'component/Presets/PresetIndicator/PresetNumberIndicator';
import PresetCard from 'component/Presets/PresetCard/PresetCard';

const SWIPE_TO_DISAPPEAR_LIMIT_PX = 150;

const Presets = () => {
  const uiState = useStore().presetsController.presetsUiState;

  useEffect(() => {
    uiState.logPresetsImpression();
  }, [uiState]);

  const swipeUpHandler = (event: SwipeEventData) => {
    if (event.absY > SWIPE_TO_DISAPPEAR_LIMIT_PX) {
      uiState.handleSwipeUp();
    }
  };

  const swipeHandlers = useSwipeable({ onSwipedUp: swipeUpHandler });
  return (
    <div
      className={styles.presetsBackground}
      {...swipeHandlers}
      data-testid="presets"
    >
      <div className={styles.presetIndicatorsWrapper}>
        {PRESET_NUMBERS.map((presetNumber) => {
          return (
            <PresetNumberIndicator
              key={presetNumber}
              presetNumber={presetNumber}
            />
          );
        })}
      </div>
      <div className={styles.presetCardsWrapper}>
        {uiState.presets.map((preset: PresetOrPlaceholderOrUnavailable) => {
          return <PresetCard key={preset.slot_index} preset={preset} />;
        })}
      </div>
    </div>
  );
};

export default observer(Presets);

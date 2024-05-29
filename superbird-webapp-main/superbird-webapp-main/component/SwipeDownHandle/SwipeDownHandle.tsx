import styles from './SwipeDownHandle.module.scss';
import { useSwipeable } from 'react-swipeable';
import { useStore } from 'context/store';

const SwipeDownHandle = () => {
  const uiState = useStore().swipeDownUiState;

  const swipeableProps = useSwipeable({
    onSwipedDown: uiState.onSwipeDown,
  });

  return (
    <div
      data-testid="swipe-down-handle"
      {...swipeableProps}
      className={styles.swipeDownHandle}
    />
  );
};

export default SwipeDownHandle;

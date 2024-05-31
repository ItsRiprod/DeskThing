import { ShelfItem } from 'store/ShelfStore';
import styles from './ShelfSwiperItem.module.scss';
import MoreItem from 'component/Shelf/ShelfItem/MoreItem';
import ContextItem from 'component/Shelf/ShelfItem/ContextItem';
import InlineTipItem from 'component/Shelf/ShelfItem/InlineTipItem';
import { useStore } from 'context/store';
import DefaultVoiceItem from 'component/Shelf/ShelfItem/DefaultVoiceItem';

type Props = {
  item: ShelfItem;
  isActive: boolean;
};

export const ARTWORK_WIDTH = 240;

const ShelfSwiperItem = ({ item, isActive }: Props) => {
  const uiState = useStore().shelfStore.shelfController.shelfSwiperItemUiState;
  return (
    <div data-selected={isActive ? 'true' : 'false'}>
      {uiState.isMoreItem(item) && <MoreItem isActive={isActive} item={item} />}
      {uiState.isContextItem(item) && (
        <ContextItem item={item} isActive={isActive} />
      )}
      {uiState.isTextPlaceholder(item) && (
        <InlineTipItem item={item} isActive={isActive} />
      )}
      {uiState.isSpacerItem(item) && <div className={styles.artwork} />}
      {uiState.isVoiceDefaultItem(item) && uiState.showPushToTalk && (
        <DefaultVoiceItem item={item} isActive={isActive} />
      )}
    </div>
  );
};

export default ShelfSwiperItem;

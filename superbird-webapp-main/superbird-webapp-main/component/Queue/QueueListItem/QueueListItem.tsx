import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import pointerListenersMaker from 'helpers/PointerListeners';

import styles from './QueueListItem.module.scss';
import { useStore } from 'context/store';
import { QueueItem } from 'store/QueueStore';
import LazyImage from 'component/LazyImage/LazyImage';
import Type from 'component/CarthingUIComponents/Type/Type';

export type Props = {
  item: QueueItem;
  isActive?: boolean;
};

const QueueListItem = ({ item, isActive = false }: Props) => {
  const [pressed, setPressed] = useState(false);

  const uiState = useStore().queueStore.queueUiState;

  return (
    <div
      className={classNames(styles.queueListItem, {
        [styles.selected]: isActive,
        [styles.pressed]: pressed || (isActive && uiState.isDialPressed),
      })}
      onClick={() => uiState.handleItemClicked(item)}
      {...pointerListenersMaker(setPressed)}
      data-testid={`queue-item-${item.uri}`}
    >
      <div className={styles.imageContainer}>
        <div className={styles.image} data-testid={`queue-image-${item.uri}`}>
          <LazyImage
            uri={item.uri}
            size={96}
            scale={1.3}
            imageId={item.image_uri}
            isActive={isActive}
          />
        </div>
      </div>

      <div className={styles.trackInfo} data-testid={`queue-info-${item.uri}`}>
        <Type
          className={styles.title}
          name="canonBold"
          dataTestId={`${isActive ? 'queue-item-title' : ''}`}
        >
          {item.name}
        </Type>
        <Type
          name="balladBook"
          className={styles.subtitle}
          dataTestId={`${isActive ? 'queue-item-subtitle' : ''}`}
        >
          {item.artist_name}
        </Type>
      </div>
    </div>
  );
};

export default observer(QueueListItem);

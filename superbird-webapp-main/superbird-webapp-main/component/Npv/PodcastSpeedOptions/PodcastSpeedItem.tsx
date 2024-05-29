import { IconCheck } from '@spotify-internal/encore-web';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import pointerListenersMaker from 'helpers/PointerListeners';

import styles from './PodcastSpeedItem.module.scss';
import { useStore } from 'context/store';
import Type from 'component/CarthingUIComponents/Type/Type';

type Props = {
  speed;
  isActive?: boolean;
};

const PodcastSpeedItem = ({ speed, isActive = false }: Props) => {
  const [pressed, setPressed] = useState(false);
  const uiState = useStore().npvStore.podcastSpeedUiState;
  const handSpeedItemClicked = (clickedItem) => {
    uiState.handSpeedItemClicked(clickedItem);
  };
  return (
    <div
      className={classNames(styles.speedItem, {
        [styles.activeItem]: isActive,
        [styles.pressed]: pressed || (isActive && uiState.dialPressed),
      })}
      onClick={() => handSpeedItemClicked(speed)}
      {...pointerListenersMaker(setPressed)}
      data-testid={`podcast-speed-item-${speed.toString()}`}
    >
      <Type name="canonBold" textColor="white">
        {speed}x
      </Type>
      {uiState.podcastSpeed === speed && <IconCheck iconSize={48} />}
    </div>
  );
};

export default observer(PodcastSpeedItem);

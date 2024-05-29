import classNames from 'classnames';
import { SpotifyLogo } from 'component/CarthingUIComponents';
import Type from 'component/CarthingUIComponents/Type/Type';
import { useStore } from 'context/store';
import pointerListeners from 'helpers/PointerListeners';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styles from './BackToSpotify.module.scss';

const BackToSpotify = () => {
  const [isPressed, setIsPressed] = useState(false);

  const controller = useStore().npvStore.otherMediaController;

  return (
    <div
      className={classNames(styles.backToSpotify, {
        [styles.pressed]: isPressed,
      })}
      onClick={controller.handleBackToSpotifyClick}
      {...pointerListeners(setIsPressed)}
    >
      <SpotifyLogo condensed useBrandColor logoHeight={32} />
      <Type name="mestroBook" textColor="white" className={styles.label}>
        Play Spotify
      </Type>
    </div>
  );
};

export default observer(BackToSpotify);

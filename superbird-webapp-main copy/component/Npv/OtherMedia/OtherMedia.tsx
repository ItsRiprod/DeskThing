import BackToSpotify from 'component/Npv/OtherMedia/BackToSpotify/BackToSpotify';
import Widget from 'component/Npv/OtherMedia/Widget/Widget';
import StatusIcons from 'component/Npv/PlayingInfo/StatusIcons';
import { useStore } from 'context/store';
import { useEffect } from 'react';
import styles from './OtherMedia.module.scss';

const OtherMedia = () => {
  const controller = useStore().npvStore.otherMediaController;

  useEffect(() => controller.logImpression(), [controller]);

  return (
    <div className={styles.otherMedia}>
      <div className={styles.topBar}>
        <BackToSpotify />
        <StatusIcons />
      </div>
      <Widget />
    </div>
  );
};

export default OtherMedia;

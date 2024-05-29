import styles from './Tracklist.module.scss';
import { isPlaylistV1OrV2URI } from '@spotify-internal/uri';
import {
  isCollectionUri,
  isNewEpisodesUri,
  isYourEpisodesUri,
} from 'helpers/SpotifyUriUtil';

const getTextBasedOnUri = (uri: string): string => {
  if (isPlaylistV1OrV2URI(uri)) {
    return 'No songs have been added to this playlist';
  } else if (isCollectionUri(uri)) {
    if (isYourEpisodesUri(uri)) {
      return "Episodes you've collected live here.";
    } else if (isNewEpisodesUri(uri)) {
      return 'Once you follow a show, episode reminders will appear here.';
    }
    return 'Songs you like will appear here.';
  }

  return '';
};

const EmptyTracklistState = ({ contextUri }: { contextUri: string }) => {
  return (
    <div className={styles.emptyBody} data-testid="empty-body">
      <p>{getTextBasedOnUri(contextUri)}</p>
    </div>
  );
};

export default EmptyTracklistState;

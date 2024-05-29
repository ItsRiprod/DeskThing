import {
  IconPlaylist,
  IconTrack,
  IconAlbum,
  IconPodcasts,
  IconArtist,
  IconRadio,
} from '@spotify-internal/encore-web';
import { parseURI, URITypeMap } from '@spotify-internal/uri';
import classNames from 'classnames';
import { getImageBorderRadius } from 'component/LazyImage/LazyImage';
import { useStore } from 'context/store';
import { isLikedSongsURI } from 'helpers/SpotifyUriUtil';
import { observer } from 'mobx-react-lite';
import styles from './Placeholder.module.scss';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

type Props = {
  uri: string;
  size: number;
  scale?: number;
  onClick?: Function;
  isActive?: boolean;
};

const Placeholder = ({ uri, size, onClick, scale = 5, isActive }: Props) => {
  const uiState = useStore().npvStore.controlButtonsUiState;

  const iconSize: IconSize = 30 as IconSize;

  const typedUri = parseURI(uri.replace('podcast', 'show'));
  let icon = <IconPlaylist iconSize={iconSize} />;

  if (isLikedSongsURI(uri)) {
    icon = <IconPlaylist iconSize={iconSize} />;
  } else if (!typedUri) {
    icon = <IconTrack iconSize={iconSize} />;
  } else {
    const type = typedUri.type;
    if (type === URITypeMap.TRACK) {
      icon = <IconTrack iconSize={iconSize} />;
    }
    if (type === URITypeMap.ALBUM) {
      icon = <IconAlbum iconSize={iconSize} />;
    }
    if (type === URITypeMap.SHOW) {
      icon = <IconPodcasts iconSize={iconSize} />;
    }
    if (type === URITypeMap.EPISODE) {
      icon = <IconPodcasts iconSize={iconSize} />;
    }
    if (type === URITypeMap.ARTIST) {
      icon = <IconArtist iconSize={iconSize} />;
    }
    if (type === URITypeMap.STATION) {
      icon = <IconRadio iconSize={iconSize} />;
    }
    if (type === URITypeMap.COLLECTION) {
      icon = <IconPlaylist iconSize={iconSize} />;
    }
  }

  return (
    <div
      className={classNames(styles.placeholder, {
        [styles.otherMedia]: !uiState.isPlayingSpotify,
      })}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderColor: isActive ? 'white' : 'rgba(255, 255, 255, 0)',
        borderRadius: getImageBorderRadius(uri, size),
      }}
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
      }}
    >
      <div
        className={styles.placeholderIcon}
        style={{ transform: `scale(${scale})` }}
      >
        {icon}
      </div>
    </div>
  );
};

export default observer(Placeholder);

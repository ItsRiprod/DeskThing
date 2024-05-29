import PlayerStore from 'store/PlayerStore';
import { isAdURI, URITypeMap } from '@spotify-internal/uri';
import QueueStore from 'store/QueueStore';
import { isRadioStationURI } from 'helpers/SpotifyUriUtil';

export const PLAYING_SUGGESTED_SONG = 'Playing Suggested Song';
export const ADVERTISEMENT = 'Advertisement';

export const titleBasedOnType = (
  playerStore: PlayerStore,
  queueStore: QueueStore,
  isNpv?: boolean,
): string => {
  const { contextUriType: contextType, contextUri } = playerStore;

  if (queueStore.isCurrentProviderQueue) {
    return 'Queue';
  }

  if (queueStore.isPlayingSuggestedSong) {
    return PLAYING_SUGGESTED_SONG;
  }

  if (!contextType) {
    return '';
  }

  if (isNpv && isAdURI(playerStore.currentTrackUri)) {
    return ADVERTISEMENT;
  }

  if (
    contextType === URITypeMap.TRACK ||
    contextType === URITypeMap.ALBUM ||
    contextType === URITypeMap.SHOW ||
    contextType === URITypeMap.EPISODE ||
    contextType === URITypeMap.SEARCH
  ) {
    return playerStore.currentTrackAlbumName;
  }

  if (contextType === URITypeMap.ARTIST) {
    return playerStore.currentTrackArtistName;
  }

  if (contextType === URITypeMap.STATION) {
    if (!playerStore.contextTitle) {
      return 'Radio';
    }
    return `Radio · ${playerStore.contextTitle}`;
  }

  if (contextType === URITypeMap.COLLECTION) {
    return contextUri.includes('your-episodes')
      ? 'Your Episodes'
      : 'Liked Songs';
  }

  if (playerStore.contextTitle) {
    return playerStore.contextTitle;
  }

  return '';
};

export const getShelfItemTitle = (title: string, uri?: string): string => {
  return uri && isRadioStationURI(uri) ? `Radio · ${title}` : title;
};

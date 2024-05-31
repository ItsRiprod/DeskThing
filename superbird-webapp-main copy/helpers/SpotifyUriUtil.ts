import {
  isEpisodeURI,
  isTrackURI,
  parseURI,
  URITypeMap,
} from '@spotify-internal/uri';

export const isTrackOrEpisode = function isTrackOrEpisode(uri: string) {
  return isTrackURI(uri) || isEpisodeURI(uri);
};

export const isCollectionUri = (uri: string) => uri.includes(':collection');

export const isYourEpisodesUri = (uri: string) =>
  isCollectionUri(uri) && uri.includes(':your-episodes');

export const isNewEpisodesUri = (uri: string) =>
  isCollectionUri(uri) && uri.includes(':podcasts:episodes');

export const isLikedSongsURI = (uri: string) => {
  return uri.startsWith('spotify:collection:tracks');
};

export const isRadioStationURI = (uri: string) => {
  return uri.includes(':station:');
};

export const isPlaylistRecommendedUri = (uri: string) => {
  return uri.includes(':playlist:') && uri.endsWith(':recommended');
};

export const maskUsernames = (payload: Object) => {
  const mask = (data: Object) => {
    if (typeof data === 'string') {
      const uri = parseURI(data);

      if (!uri) return data;

      const strippedUri = data.split('?')[0];
      const components = strippedUri.split(':');
      const usernamePos = components.indexOf('user');
      if (usernamePos !== -1 && components[usernamePos + 1]) {
        components[usernamePos + 1] = '####';
      }
      return components.join(':');
    } else if (typeof data === 'object') {
      return maskUsernames(data);
    }
    return data;
  };

  return Object.entries(payload ?? {}).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: mask(value) }),
    {},
  );
};

export const fromUriToPresetCategoryType = (uri: string) => {
  const type = parseURI(uri)?.type;
  switch (type) {
    case URITypeMap.PLAYLIST:
      return 'Playlist';
    case URITypeMap.PLAYLIST_V2:
      return 'Playlist';
    case URITypeMap.COLLECTION:
      return 'Playlist';
    case URITypeMap.ARTIST:
      return 'Artist';
    case URITypeMap.ARTIST_TOPLIST:
      return 'Artist';
    case URITypeMap.STATION:
      return 'Radio';
    case URITypeMap.RADIO:
      return 'Radio';
    case URITypeMap.ALBUM:
      return 'Album';
    case URITypeMap.SHOW:
      return 'Podcast';
    case URITypeMap.EPISODE:
      return 'Podcast';
    default:
      return '';
  }
};

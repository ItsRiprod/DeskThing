/**
 * The various URI Types.
 */
export const URITypeMap = {
  AD: 'ad',
  ALBUM: 'album',
  APPLICATION: 'application',
  ARTIST: 'artist',
  ARTIST_TOPLIST: 'artist-toplist',
  AUDIO_FILE: 'audiofile',
  COLLECTION: 'collection',
  COLLECTION_ALBUM: 'collection-album',
  COLLECTION_ARTIST: 'collection-artist',
  COLLECTION_MISSING_ALBUM: 'collection-missing-album',
  COLLECTION_TRACK_LIST: 'collectiontracklist',
  CONCERT: 'concert',
  CONTEXT_GROUP: 'context-group',
  DAILY_MIX: 'dailymix',
  EMPTY: 'empty',
  EPISODE: 'episode',
  FACEBOOK: 'facebook',
  FOLDER: 'folder',
  FOLLOWERS: 'followers',
  FOLLOWING: 'following',
  IMAGE: 'image',
  INBOX: 'inbox',
  INTERRUPTION: 'interruption',
  LIBRARY: 'library',
  LIVE: 'live',
  /**
   * @deprecated - Use `LOCAL_TRACK` instead.
   */
  LOCAL: 'local',
  LOCAL_TRACK: 'local',
  LOCAL_ALBUM: 'local-album',
  LOCAL_ARTIST: 'local-artist',
  MOSAIC: 'mosaic',
  PLAYLIST: 'playlist',
  PLAYLIST_V2: 'playlist-v2', // Only used for URI classification, not a fragment
  PROFILE: 'profile',
  PUBLISHED_ROOTLIST: 'published-rootlist',
  RADIO: 'radio',
  ROOTLIST: 'rootlist',
  SEARCH: 'search',
  SHOW: 'show',
  SOCIAL_SESSION: 'socialsession',
  SPECIAL: 'special',
  STARRED: 'starred',
  STATION: 'station',
  TEMP_PLAYLIST: 'temp-playlist',
  TOPLIST: 'toplist',
  TRACK: 'track',
  TRACKSET: 'trackset',
  USER_TOPLIST: 'user-toplist',
  USER_TOP_TRACKS: 'user-top-tracks',
} as const;

export type URIType = typeof URITypeMap[keyof typeof URITypeMap];

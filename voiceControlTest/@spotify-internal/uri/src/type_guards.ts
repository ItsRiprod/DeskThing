import {URITypeMap} from './enums/uri_type';

import * as URITypeDefs from './uri_typedefs';
import {URI, parseURI} from './uri';

export function isAdURI(uri: URI): uri is URITypeDefs.AdURI;
export function isAdURI(uri: URI | string): boolean;
export function isAdURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.AD;
}

export function isAlbumURI(uri: URI): uri is URITypeDefs.AlbumURI;
export function isAlbumURI(uri: URI | string): boolean;
export function isAlbumURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.ALBUM;
}

export function isApplicationURI(uri: URI): uri is URITypeDefs.ApplicationURI;
export function isApplicationURI(uri: URI | string): boolean;
export function isApplicationURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.APPLICATION;
}

export function isArtistURI(uri: URI): uri is URITypeDefs.ArtistURI;
export function isArtistURI(uri: URI | string): boolean;
export function isArtistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.ARTIST;
}

export function isArtistToplistURI(
  uri: URI
): uri is URITypeDefs.ArtistToplistURI;
export function isArtistToplistURI(uri: URI | string): boolean;
export function isArtistToplistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.ARTIST_TOPLIST;
}

export function isAudioFileURI(uri: URI): uri is URITypeDefs.AudioFileURI;
export function isAudioFileURI(uri: URI | string): boolean;
export function isAudioFileURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.AUDIO_FILE;
}

export function isCollectionURI(uri: URI): uri is URITypeDefs.CollectionURI;
export function isCollectionURI(uri: URI | string): boolean;
export function isCollectionURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.COLLECTION;
}

export function isCollectionAlbumURI(
  uri: URI
): uri is URITypeDefs.CollectionAlbumURI;
export function isCollectionAlbumURI(uri: URI | string): boolean;
export function isCollectionAlbumURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.COLLECTION_ALBUM;
}

export function isCollectionArtistURI(
  uri: URI
): uri is URITypeDefs.CollectionArtistURI;
export function isCollectionArtistURI(uri: URI | string): boolean;
export function isCollectionArtistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.COLLECTION_ARTIST;
}

export function isCollectionMissingAlbumURI(
  uri: URI
): uri is URITypeDefs.CollectionMissingAlbumURI;
export function isCollectionMissingAlbumURI(uri: URI | string): boolean;
export function isCollectionMissingAlbumURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.COLLECTION_MISSING_ALBUM;
}

export function isCollectionTrackListURI(
  uri: URI
): uri is URITypeDefs.CollectionTrackListURI;
export function isCollectionTrackListURI(uri: URI | string): boolean;
export function isCollectionTrackListURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.COLLECTION_TRACK_LIST;
}

export function isConcertURI(uri: URI): uri is URITypeDefs.ConcertURI;
export function isConcertURI(uri: URI | string): boolean;
export function isConcertURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.CONCERT;
}

export function isContextGroupURI(uri: URI): uri is URITypeDefs.ContextGroupURI;
export function isContextGroupURI(uri: URI | string): boolean;
export function isContextGroupURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.CONTEXT_GROUP;
}

export function isDailyMixURI(uri: URI): uri is URITypeDefs.DailyMixURI;
export function isDailyMixURI(uri: URI | string): boolean;
export function isDailyMixURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.DAILY_MIX;
}

export function isEmptyURI(uri: URI): uri is URITypeDefs.EmptyURI;
export function isEmptyURI(uri: URI | string): boolean;
export function isEmptyURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.EMPTY;
}

export function isEpisodeURI(uri: URI): uri is URITypeDefs.EpisodeURI;
export function isEpisodeURI(uri: URI | string): boolean;
export function isEpisodeURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.EPISODE;
}

export function isFacebookURI(uri: URI): uri is URITypeDefs.FacebookURI;
export function isFacebookURI(uri: URI | string): boolean;
export function isFacebookURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.FACEBOOK;
}

export function isFolderURI(uri: URI): uri is URITypeDefs.FolderURI;
export function isFolderURI(uri: URI | string): boolean;
export function isFolderURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.FOLDER;
}

export function isFollowersURI(uri: URI): uri is URITypeDefs.FollowersURI;
export function isFollowersURI(uri: URI | string): boolean;
export function isFollowersURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.FOLLOWERS;
}

export function isFollowingURI(uri: URI): uri is URITypeDefs.FollowingURI;
export function isFollowingURI(uri: URI | string): boolean;
export function isFollowingURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.FOLLOWING;
}

export function isImageURI(uri: URI): uri is URITypeDefs.ImageURI;
export function isImageURI(uri: URI | string): boolean;
export function isImageURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.IMAGE;
}

export function isInboxURI(uri: URI): uri is URITypeDefs.InboxURI;
export function isInboxURI(uri: URI | string): boolean;
export function isInboxURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.INBOX;
}

export function isInterruptionURI(uri: URI): uri is URITypeDefs.InterruptionURI;
export function isInterruptionURI(uri: URI | string): boolean;
export function isInterruptionURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.INTERRUPTION;
}

export function isLibraryURI(uri: URI): uri is URITypeDefs.LibraryURI;
export function isLibraryURI(uri: URI | string): boolean;
export function isLibraryURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.LIBRARY;
}

export function isLiveURI(uri: URI): uri is URITypeDefs.LiveURI;
export function isLiveURI(uri: URI | string): boolean;
export function isLiveURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.LIVE;
}

/**
 * Type guard to check if a URI is a local track URI.
 *
 * @deprecated Use `isLocalTrackURI` instead
 * @param uri - The URI to check.
 * @return True if the URI is a `local` URI.
 */
export function isLocalURI(uri: URI): uri is URITypeDefs.LocalURI;
export function isLocalURI(uri: URI | string): boolean;
export function isLocalURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.LOCAL;
}

export function isLocalTrackURI(uri: URI): uri is URITypeDefs.LocalTrackURI;
export function isLocalTrackURI(uri: URI | string): boolean;
export function isLocalTrackURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.LOCAL_TRACK;
}

export function isLocalAlbumURI(uri: URI): uri is URITypeDefs.LocalAlbumURI;
export function isLocalAlbumURI(uri: URI | string): boolean;
export function isLocalAlbumURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.LOCAL_ALBUM;
}

export function isLocalArtistURI(uri: URI): uri is URITypeDefs.LocalArtistURI;
export function isLocalArtistURI(uri: URI | string): boolean;
export function isLocalArtistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.LOCAL_ARTIST;
}

export function isMosaicURI(uri: URI): uri is URITypeDefs.MosaicURI;
export function isMosaicURI(uri: URI | string): boolean;
export function isMosaicURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.MOSAIC;
}

export function isPlaylistV1URI(uri: URI): uri is URITypeDefs.PlaylistURI;
export function isPlaylistV1URI(uri: URI | string): boolean;
export function isPlaylistV1URI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.PLAYLIST;
}

/**
 * @deprecated Use `isPlaylistV1URI` instead.
 */
export const isPlaylistURI = isPlaylistV1URI;

export function isPlaylistV2URI(uri: URI): uri is URITypeDefs.PlaylistV2URI;
export function isPlaylistV2URI(uri: URI | string): boolean;
export function isPlaylistV2URI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.PLAYLIST_V2;
}

export function isPlaylistV1OrV2URI(uri: URI): uri is URITypeDefs.PlaylistURI;
export function isPlaylistV1OrV2URI(uri: URI | string): boolean;
export function isPlaylistV1OrV2URI(uri: URI | string): boolean {
  return isPlaylistV1URI(uri) || isPlaylistV2URI(uri);
}

export function isProfileURI(uri: URI): uri is URITypeDefs.ProfileURI;
export function isProfileURI(uri: URI | string): boolean;
export function isProfileURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.PROFILE;
}

export function isPublishedRootlistURI(
  uri: URI
): uri is URITypeDefs.PublishedRootlistURI;
export function isPublishedRootlistURI(uri: URI | string): boolean;
export function isPublishedRootlistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.PUBLISHED_ROOTLIST;
}

export function isRadioURI(uri: URI): uri is URITypeDefs.RadioURI;
export function isRadioURI(uri: URI | string): boolean;
export function isRadioURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.RADIO;
}

export function isRootlistURI(uri: URI): uri is URITypeDefs.RootlistURI;
export function isRootlistURI(uri: URI | string): boolean;
export function isRootlistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.ROOTLIST;
}

export function isSearchURI(uri: URI): uri is URITypeDefs.SearchURI;
export function isSearchURI(uri: URI | string): boolean;
export function isSearchURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.SEARCH;
}

export function isShowURI(uri: URI): uri is URITypeDefs.ShowURI;
export function isShowURI(uri: URI | string): boolean;
export function isShowURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.SHOW;
}

export function isSocialSessionURI(
  uri: URI
): uri is URITypeDefs.SocialSessionURI;
export function isSocialSessionURI(uri: URI | string): boolean;
export function isSocialSessionURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.SOCIAL_SESSION;
}

export function isSpecialURI(uri: URI): uri is URITypeDefs.SpecialURI;
export function isSpecialURI(uri: URI | string): boolean;
export function isSpecialURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.SPECIAL;
}

export function isStarredURI(uri: URI): uri is URITypeDefs.StarredURI;
export function isStarredURI(uri: URI | string): boolean;
export function isStarredURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.STARRED;
}

export function isStationURI(uri: URI): uri is URITypeDefs.StationURI;
export function isStationURI(uri: URI | string): boolean;
export function isStationURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.STATION;
}

export function isTemporaryPlaylistURI(
  uri: URI
): uri is URITypeDefs.TemporaryPlaylistURI;
export function isTemporaryPlaylistURI(uri: URI | string): boolean;
export function isTemporaryPlaylistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.TEMP_PLAYLIST;
}

export function isToplistURI(uri: URI): uri is URITypeDefs.ToplistURI;
export function isToplistURI(uri: URI | string): boolean;
export function isToplistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.TOPLIST;
}

export function isTrackURI(uri: URI): uri is URITypeDefs.TrackURI;
export function isTrackURI(uri: URI | string): boolean;
export function isTrackURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.TRACK;
}

export function isTracksetURI(uri: URI): uri is URITypeDefs.TracksetURI;
export function isTracksetURI(uri: URI | string): boolean;
export function isTracksetURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.TRACKSET;
}

export function isUserToplistURI(uri: URI): uri is URITypeDefs.UserToplistURI;
export function isUserToplistURI(uri: URI | string): boolean;
export function isUserToplistURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.USER_TOPLIST;
}

export function isUserTopTracksURI(
  uri: URI
): uri is URITypeDefs.UserTopTracksURI;
export function isUserTopTracksURI(uri: URI | string): boolean;
export function isUserTopTracksURI(uri: URI | string): boolean {
  return parseURI(uri)?.type === URITypeMap.USER_TOP_TRACKS;
}

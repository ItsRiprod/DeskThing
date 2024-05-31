import { URITypeMap } from './enums/uri_type';
import { parseURI } from './uri';
export function isAdURI(uri) {
    return parseURI(uri)?.type === URITypeMap.AD;
}
export function isAlbumURI(uri) {
    return parseURI(uri)?.type === URITypeMap.ALBUM;
}
export function isApplicationURI(uri) {
    return parseURI(uri)?.type === URITypeMap.APPLICATION;
}
export function isArtistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.ARTIST;
}
export function isArtistToplistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.ARTIST_TOPLIST;
}
export function isAudioFileURI(uri) {
    return parseURI(uri)?.type === URITypeMap.AUDIO_FILE;
}
export function isCollectionURI(uri) {
    return parseURI(uri)?.type === URITypeMap.COLLECTION;
}
export function isCollectionAlbumURI(uri) {
    return parseURI(uri)?.type === URITypeMap.COLLECTION_ALBUM;
}
export function isCollectionArtistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.COLLECTION_ARTIST;
}
export function isCollectionMissingAlbumURI(uri) {
    return parseURI(uri)?.type === URITypeMap.COLLECTION_MISSING_ALBUM;
}
export function isCollectionTrackListURI(uri) {
    return parseURI(uri)?.type === URITypeMap.COLLECTION_TRACK_LIST;
}
export function isConcertURI(uri) {
    return parseURI(uri)?.type === URITypeMap.CONCERT;
}
export function isContextGroupURI(uri) {
    return parseURI(uri)?.type === URITypeMap.CONTEXT_GROUP;
}
export function isDailyMixURI(uri) {
    return parseURI(uri)?.type === URITypeMap.DAILY_MIX;
}
export function isEmptyURI(uri) {
    return parseURI(uri)?.type === URITypeMap.EMPTY;
}
export function isEpisodeURI(uri) {
    return parseURI(uri)?.type === URITypeMap.EPISODE;
}
export function isFacebookURI(uri) {
    return parseURI(uri)?.type === URITypeMap.FACEBOOK;
}
export function isFolderURI(uri) {
    return parseURI(uri)?.type === URITypeMap.FOLDER;
}
export function isFollowersURI(uri) {
    return parseURI(uri)?.type === URITypeMap.FOLLOWERS;
}
export function isFollowingURI(uri) {
    return parseURI(uri)?.type === URITypeMap.FOLLOWING;
}
export function isImageURI(uri) {
    return parseURI(uri)?.type === URITypeMap.IMAGE;
}
export function isInboxURI(uri) {
    return parseURI(uri)?.type === URITypeMap.INBOX;
}
export function isInterruptionURI(uri) {
    return parseURI(uri)?.type === URITypeMap.INTERRUPTION;
}
export function isLibraryURI(uri) {
    return parseURI(uri)?.type === URITypeMap.LIBRARY;
}
export function isLiveURI(uri) {
    return parseURI(uri)?.type === URITypeMap.LIVE;
}
export function isLocalURI(uri) {
    return parseURI(uri)?.type === URITypeMap.LOCAL;
}
export function isLocalTrackURI(uri) {
    return parseURI(uri)?.type === URITypeMap.LOCAL_TRACK;
}
export function isLocalAlbumURI(uri) {
    return parseURI(uri)?.type === URITypeMap.LOCAL_ALBUM;
}
export function isLocalArtistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.LOCAL_ARTIST;
}
export function isMosaicURI(uri) {
    return parseURI(uri)?.type === URITypeMap.MOSAIC;
}
export function isPlaylistV1URI(uri) {
    return parseURI(uri)?.type === URITypeMap.PLAYLIST;
}
/**
 * @deprecated Use `isPlaylistV1URI` instead.
 */
export const isPlaylistURI = isPlaylistV1URI;
export function isPlaylistV2URI(uri) {
    return parseURI(uri)?.type === URITypeMap.PLAYLIST_V2;
}
export function isPlaylistV1OrV2URI(uri) {
    return isPlaylistV1URI(uri) || isPlaylistV2URI(uri);
}
export function isProfileURI(uri) {
    return parseURI(uri)?.type === URITypeMap.PROFILE;
}
export function isPublishedRootlistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.PUBLISHED_ROOTLIST;
}
export function isRadioURI(uri) {
    return parseURI(uri)?.type === URITypeMap.RADIO;
}
export function isRootlistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.ROOTLIST;
}
export function isSearchURI(uri) {
    return parseURI(uri)?.type === URITypeMap.SEARCH;
}
export function isShowURI(uri) {
    return parseURI(uri)?.type === URITypeMap.SHOW;
}
export function isSocialSessionURI(uri) {
    return parseURI(uri)?.type === URITypeMap.SOCIAL_SESSION;
}
export function isSpecialURI(uri) {
    return parseURI(uri)?.type === URITypeMap.SPECIAL;
}
export function isStarredURI(uri) {
    return parseURI(uri)?.type === URITypeMap.STARRED;
}
export function isStationURI(uri) {
    return parseURI(uri)?.type === URITypeMap.STATION;
}
export function isTemporaryPlaylistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.TEMP_PLAYLIST;
}
export function isToplistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.TOPLIST;
}
export function isTrackURI(uri) {
    return parseURI(uri)?.type === URITypeMap.TRACK;
}
export function isTracksetURI(uri) {
    return parseURI(uri)?.type === URITypeMap.TRACKSET;
}
export function isUserToplistURI(uri) {
    return parseURI(uri)?.type === URITypeMap.USER_TOPLIST;
}
export function isUserTopTracksURI(uri) {
    return parseURI(uri)?.type === URITypeMap.USER_TOP_TRACKS;
}

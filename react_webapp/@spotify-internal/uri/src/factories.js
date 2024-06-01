import { URITypeMap } from './enums/uri_type';
import { createURI, parseURIFromString } from './uri';
export function adURI(id) {
    return createURI(URITypeMap.AD, { id });
}
export function albumURI(id, disc) {
    return createURI(URITypeMap.ALBUM, {
        id,
        disc,
        hasBase62Id: true,
    });
}
export function applicationURI(id, args) {
    return createURI(URITypeMap.APPLICATION, {
        id: id,
        args: Array.isArray(args) ? args : [],
    });
}
export function artistURI(id) {
    return createURI(URITypeMap.ARTIST, {
        id,
        hasBase62Id: true,
    });
}
export function artistToplistURI(id, toplist) {
    return createURI(URITypeMap.ARTIST_TOPLIST, {
        id,
        toplist,
        hasBase62Id: true,
    });
}
export function audioFileURI(extension, id) {
    return createURI(URITypeMap.AUDIO_FILE, {
        id,
        extension,
    });
}
export function collectionURI(username, category) {
    return createURI(URITypeMap.COLLECTION, {
        username,
        category: category ?? null,
    });
}
export function collectionAlbumURI(username, id) {
    return createURI(URITypeMap.COLLECTION_ALBUM, {
        id,
        username,
        hasBase62Id: true,
    });
}
export function collectionArtistURI(username, id) {
    return createURI(URITypeMap.COLLECTION_ARTIST, {
        id,
        username,
        hasBase62Id: true,
    });
}
export function collectionMissingAlbumURI(username, id) {
    return createURI(URITypeMap.COLLECTION_MISSING_ALBUM, {
        id,
        username,
        hasBase62Id: true,
    });
}
export function collectionTrackListURI(username, id) {
    return createURI(URITypeMap.COLLECTION_TRACK_LIST, {
        id,
        username,
        hasBase62Id: true,
    });
}
export function concertURI(id) {
    return createURI(URITypeMap.CONCERT, {
        id,
        hasBase62Id: true,
    });
}
export function contextGroupURI(origin, name) {
    return createURI(URITypeMap.CONTEXT_GROUP, {
        origin,
        name,
        hasBase62Id: true,
    });
}
export function dailyMixURI(id) {
    return createURI(URITypeMap.DAILY_MIX, {
        id,
        hasBase62Id: true,
    });
}
export function emptyURI() {
    return createURI(URITypeMap.EMPTY, {});
}
export function episodeURI(id, context, play) {
    return createURI(URITypeMap.EPISODE, {
        id,
        context: context ? parseURIFromString(context) : null,
        play,
        hasBase62Id: true,
    });
}
export function facebookURI(uid) {
    return createURI(URITypeMap.FACEBOOK, { uid: uid });
}
export function folderURI(username, id) {
    return createURI(URITypeMap.FOLDER, {
        id,
        username,
        hasBase62Id: true,
    });
}
export function followersURI(username) {
    return createURI(URITypeMap.FOLLOWERS, {
        username,
    });
}
export function followingURI(username) {
    return createURI(URITypeMap.FOLLOWING, {
        username,
    });
}
export function imageURI(id) {
    return createURI(URITypeMap.IMAGE, {
        id,
        hasBase62Id: true,
    });
}
export function inboxURI(username) {
    return createURI(URITypeMap.INBOX, { username });
}
export function interruptionURI(id) {
    return createURI(URITypeMap.INTERRUPTION, {
        id: id,
    });
}
export function libraryURI(username, category) {
    return createURI(URITypeMap.LIBRARY, {
        username: username,
        category: category ?? null,
    });
}
export function liveURI(id) {
    return createURI(URITypeMap.LIVE, {
        id,
        hasBase62Id: true,
    });
}
export function localTrackURI(artist, album, track, duration) {
    return createURI(URITypeMap.LOCAL_TRACK, {
        artist: artist,
        album: album,
        track: track,
        duration: duration,
    });
}
/**
 * @deprecated Use `localTrackURI` instead.
 */
export const localURI = localTrackURI;
export function localAlbumURI(artist, album) {
    return createURI(URITypeMap.LOCAL_ALBUM, {
        artist: artist,
        album: album,
    });
}
export function localArtistURI(artist) {
    return createURI(URITypeMap.LOCAL_ARTIST, {
        artist: artist,
    });
}
export function mosaicURI(ids) {
    return createURI(URITypeMap.MOSAIC, { ids: ids });
}
export function playlistURI(username, id) {
    return createURI(URITypeMap.PLAYLIST, {
        id,
        username: username,
        hasBase62Id: true,
    });
}
export function playlistV2URI(id) {
    return createURI(URITypeMap.PLAYLIST_V2, {
        id,
        hasBase62Id: true,
    });
}
export function profileURI(username, args) {
    return createURI(URITypeMap.PROFILE, {
        username: username,
        args: args ?? [],
    });
}
export function publishedRootlistURI(username) {
    return createURI(URITypeMap.PUBLISHED_ROOTLIST, {
        username: username,
    });
}
export function radioURI(args) {
    return createURI(URITypeMap.RADIO, {
        args: args ?? '',
    });
}
export function rootlistURI(username) {
    return createURI(URITypeMap.ROOTLIST, {
        username: username,
    });
}
export function searchURI(query) {
    return createURI(URITypeMap.SEARCH, { query: query });
}
export function showURI(id) {
    return createURI(URITypeMap.SHOW, { id, hasBase62Id: true });
}
export function socialSessionURI(id) {
    return createURI(URITypeMap.SOCIAL_SESSION, {
        id,
        hasBase62Id: true,
    });
}
export function specialURI(args) {
    return createURI(URITypeMap.SPECIAL, {
        args: args ?? [],
    });
}
export function starredURI(username) {
    return createURI(URITypeMap.STARRED, {
        username: username,
    });
}
export function stationURI(args) {
    return createURI(URITypeMap.STATION, {
        args: args ?? [],
    });
}
export function temporaryPlaylistURI(origin, data) {
    return createURI(URITypeMap.TEMP_PLAYLIST, {
        origin: origin,
        data: data,
    });
}
export function toplistURI(toplist, country, global) {
    return createURI(URITypeMap.TOPLIST, {
        toplist: toplist,
        country: country,
        global: Boolean(global),
    });
}
export function trackURI(id, anchor, context, play) {
    return createURI(URITypeMap.TRACK, {
        id,
        anchor: anchor,
        context: context ? parseURIFromString(context) : null,
        play: play,
        hasBase62Id: true,
    });
}
export function tracksetURI(tracks, name, index) {
    return createURI(URITypeMap.TRACKSET, {
        tracks: tracks,
        name: name || '',
        index: isNaN(index) ? null : index ?? null,
    });
}
export function userToplistURI(username, toplist) {
    return createURI(URITypeMap.USER_TOPLIST, {
        username: username,
        toplist: toplist,
    });
}
export function userTopTracksURI(username) {
    return createURI(URITypeMap.USER_TOP_TRACKS, {
        username: username,
    });
}

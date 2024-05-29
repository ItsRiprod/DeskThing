import {URITypeMap} from './enums/uri_type';

import * as URITypeDefs from './uri_typedefs';
import {createURI, parseURIFromString} from './uri';

export function adURI(id: string): URITypeDefs.AdURI {
  return createURI(URITypeMap.AD, {id});
}

export function albumURI(id: string, disc?: number): URITypeDefs.AlbumURI {
  return createURI(URITypeMap.ALBUM, {
    id,
    disc,
    hasBase62Id: true,
  });
}

export function applicationURI(
  id: string,
  args?: string[]
): URITypeDefs.ApplicationURI {
  return createURI(URITypeMap.APPLICATION, {
    id: id,
    args: Array.isArray(args) ? args : [],
  });
}

export function artistURI(id: string): URITypeDefs.ArtistURI {
  return createURI(URITypeMap.ARTIST, {
    id,
    hasBase62Id: true,
  });
}

export function artistToplistURI(
  id: string,
  toplist: string
): URITypeDefs.ArtistToplistURI {
  return createURI(URITypeMap.ARTIST_TOPLIST, {
    id,
    toplist,
    hasBase62Id: true,
  });
}

export function audioFileURI(
  extension: string,
  id: string
): URITypeDefs.AudioFileURI {
  return createURI(URITypeMap.AUDIO_FILE, {
    id,
    extension,
  });
}

export function collectionURI(
  username: string,
  category?: string
): URITypeDefs.CollectionURI {
  return createURI(URITypeMap.COLLECTION, {
    username,
    category: category ?? null,
  });
}

export function collectionAlbumURI(
  username: string,
  id: string
): URITypeDefs.CollectionAlbumURI {
  return createURI(URITypeMap.COLLECTION_ALBUM, {
    id,
    username,
    hasBase62Id: true,
  });
}

export function collectionArtistURI(
  username: string,
  id: string
): URITypeDefs.CollectionArtistURI {
  return createURI(URITypeMap.COLLECTION_ARTIST, {
    id,
    username,
    hasBase62Id: true,
  });
}

export function collectionMissingAlbumURI(
  username: string,
  id: string
): URITypeDefs.CollectionMissingAlbumURI {
  return createURI(URITypeMap.COLLECTION_MISSING_ALBUM, {
    id,
    username,
    hasBase62Id: true,
  });
}

export function collectionTrackListURI(
  username: string,
  id: string
): URITypeDefs.CollectionTrackListURI {
  return createURI(URITypeMap.COLLECTION_TRACK_LIST, {
    id,
    username,
    hasBase62Id: true,
  });
}

export function concertURI(id: string): URITypeDefs.ConcertURI {
  return createURI(URITypeMap.CONCERT, {
    id,
    hasBase62Id: true,
  });
}

export function contextGroupURI(
  origin: string,
  name: string
): URITypeDefs.ContextGroupURI {
  return createURI(URITypeMap.CONTEXT_GROUP, {
    origin,
    name,
    hasBase62Id: true,
  });
}

export function dailyMixURI(id: string): URITypeDefs.DailyMixURI {
  return createURI(URITypeMap.DAILY_MIX, {
    id,
    hasBase62Id: true,
  });
}

export function emptyURI(): URITypeDefs.EmptyURI {
  return createURI(URITypeMap.EMPTY, {});
}

export function episodeURI(
  id: string,
  context?: string,
  play?: string
): URITypeDefs.EpisodeURI {
  return createURI(URITypeMap.EPISODE, {
    id,
    context: context ? parseURIFromString(context) : null,
    play,
    hasBase62Id: true,
  });
}

export function facebookURI(uid: string): URITypeDefs.FacebookURI {
  return createURI(URITypeMap.FACEBOOK, {uid: uid});
}

export function folderURI(username: string, id: string): URITypeDefs.FolderURI {
  return createURI(URITypeMap.FOLDER, {
    id,
    username,
    hasBase62Id: true,
  });
}

export function followersURI(username: string): URITypeDefs.FollowersURI {
  return createURI(URITypeMap.FOLLOWERS, {
    username,
  });
}

export function followingURI(username: string): URITypeDefs.FollowingURI {
  return createURI(URITypeMap.FOLLOWING, {
    username,
  });
}

export function imageURI(id: string): URITypeDefs.ImageURI {
  return createURI(URITypeMap.IMAGE, {
    id,
    hasBase62Id: true,
  });
}

export function inboxURI(username: string): URITypeDefs.InboxURI {
  return createURI(URITypeMap.INBOX, {username});
}

export function interruptionURI(id: string): URITypeDefs.InterruptionURI {
  return createURI(URITypeMap.INTERRUPTION, {
    id: id,
  });
}

export function libraryURI(
  username: string,
  category?: string
): URITypeDefs.LibraryURI {
  return createURI(URITypeMap.LIBRARY, {
    username: username,
    category: category ?? null,
  });
}

export function liveURI(id: string): URITypeDefs.LiveURI {
  return createURI(URITypeMap.LIVE, {
    id,
    hasBase62Id: true,
  });
}

export function localTrackURI(
  artist: string,
  album: string,
  track: string,
  duration: number
): URITypeDefs.LocalTrackURI {
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

export function localAlbumURI(
  artist: string,
  album: string
): URITypeDefs.LocalAlbumURI {
  return createURI(URITypeMap.LOCAL_ALBUM, {
    artist: artist,
    album: album,
  });
}

export function localArtistURI(artist: string): URITypeDefs.LocalArtistURI {
  return createURI(URITypeMap.LOCAL_ARTIST, {
    artist: artist,
  });
}

export function mosaicURI(ids: string[]): URITypeDefs.MosaicURI {
  return createURI(URITypeMap.MOSAIC, {ids: ids});
}

export function playlistURI(
  username: string,
  id: string
): URITypeDefs.PlaylistURI {
  return createURI(URITypeMap.PLAYLIST, {
    id,
    username: username,
    hasBase62Id: true,
  });
}

export function playlistV2URI(id: string): URITypeDefs.PlaylistV2URI {
  return createURI(URITypeMap.PLAYLIST_V2, {
    id,
    hasBase62Id: true,
  });
}

export function profileURI(
  username: string,
  args?: string[]
): URITypeDefs.ProfileURI {
  return createURI(URITypeMap.PROFILE, {
    username: username,
    args: args ?? [],
  });
}

export function publishedRootlistURI(
  username: string
): URITypeDefs.PublishedRootlistURI {
  return createURI(URITypeMap.PUBLISHED_ROOTLIST, {
    username: username,
  });
}

export function radioURI(args?: string): URITypeDefs.RadioURI {
  return createURI(URITypeMap.RADIO, {
    args: args ?? '',
  });
}

export function rootlistURI(username: string): URITypeDefs.RootlistURI {
  return createURI(URITypeMap.ROOTLIST, {
    username: username,
  });
}

export function searchURI(query: string): URITypeDefs.SearchURI {
  return createURI(URITypeMap.SEARCH, {query: query});
}

export function showURI(id: string): URITypeDefs.ShowURI {
  return createURI(URITypeMap.SHOW, {id, hasBase62Id: true});
}
export function socialSessionURI(id: string): URITypeDefs.SocialSessionURI {
  return createURI(URITypeMap.SOCIAL_SESSION, {
    id,
    hasBase62Id: true,
  });
}

export function specialURI(args?: string[]): URITypeDefs.SpecialURI {
  return createURI(URITypeMap.SPECIAL, {
    args: args ?? [],
  });
}

export function starredURI(username: string): URITypeDefs.StarredURI {
  return createURI(URITypeMap.STARRED, {
    username: username,
  });
}

export function stationURI(args?: string[]): URITypeDefs.StationURI {
  return createURI(URITypeMap.STATION, {
    args: args ?? [],
  });
}

export function temporaryPlaylistURI(
  origin: string,
  data: string
): URITypeDefs.TemporaryPlaylistURI {
  return createURI(URITypeMap.TEMP_PLAYLIST, {
    origin: origin,
    data: data,
  });
}

export function toplistURI(
  toplist: string,
  country?: string,
  global?: boolean
): URITypeDefs.ToplistURI {
  return createURI(URITypeMap.TOPLIST, {
    toplist: toplist,
    country: country,
    global: Boolean(global),
  });
}

export function trackURI(
  id: string,
  anchor?: string,
  context?: string,
  play?: string
): URITypeDefs.TrackURI {
  return createURI(URITypeMap.TRACK, {
    id,
    anchor: anchor,
    context: context ? parseURIFromString(context) : null,
    play: play,
    hasBase62Id: true,
  });
}
export function tracksetURI(
  tracks: URITypeDefs.TrackURI[],
  name?: string,
  index?: number | null
): URITypeDefs.TracksetURI {
  return createURI(URITypeMap.TRACKSET, {
    tracks: tracks,
    name: name || '',
    index: isNaN(index as unknown as number) ? null : index ?? null,
  });
}

export function userToplistURI(
  username: string,
  toplist: string
): URITypeDefs.UserToplistURI {
  return createURI(URITypeMap.USER_TOPLIST, {
    username: username,
    toplist: toplist,
  });
}

export function userTopTracksURI(
  username: string
): URITypeDefs.UserTopTracksURI {
  return createURI(URITypeMap.USER_TOP_TRACKS, {
    username: username,
  });
}

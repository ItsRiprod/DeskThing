import { URIParticle } from '../enums/uri_particle';
import { URITypeMap } from '../enums/uri_type';
import { encodeComponent } from './helpers';
export function encodeQueryString(values) {
    let str = '?';
    for (const key in values) {
        if (values.hasOwnProperty(key) && values[key] !== undefined) {
            if (str.length > 1) {
                str += '&';
            }
            const value = values[key];
            if (typeof value !== 'undefined') {
                str += `${key}=${encodeURIComponent(value)}`;
            }
        }
    }
    return str;
}
/**
 * Returns the components of a URI as an array.
 *
 * @param uri - An uri.
 * @param format - The output URIformat.
 * @return An array of uri components.
 */
export function getComponents(uri, format) {
    let components;
    let i;
    let len;
    let trackIds = [];
    let args;
    switch (uri.type) {
        case URITypeMap.ALBUM:
            components = [URITypeMap.ALBUM, uri.id];
            if (uri.disc) {
                components.push(uri.disc);
            }
            return components;
        case URITypeMap.AD:
            return [URITypeMap.AD, uri.id];
        case URITypeMap.ARTIST:
            return [URITypeMap.ARTIST, uri.id];
        case URITypeMap.ARTIST_TOPLIST:
            return [URITypeMap.ARTIST, uri.id, URIParticle.TOP, uri.toplist];
        case URITypeMap.DAILY_MIX:
            return [URITypeMap.DAILY_MIX, uri.id];
        case URITypeMap.SEARCH:
            return [URITypeMap.SEARCH, encodeComponent(uri.query, format)];
        case URITypeMap.TRACK: {
            let base62 = uri.id;
            if (uri.context || uri.play) {
                base62 += encodeQueryString({
                    context: uri.context,
                    play: uri.play,
                });
            }
            if (uri.anchor) {
                base62 += `#${uri.anchor}`;
            }
            return [URITypeMap.TRACK, base62];
        }
        case URITypeMap.TRACKSET:
            trackIds = [];
            if (uri.tracks) {
                for (i = 0, len = uri.tracks.length; i < len; i++) {
                    trackIds.push(uri.tracks[i].id);
                }
            }
            trackIds = [trackIds.join(',')];
            // Index can be 0 sometimes (required for trackset)
            if (uri.index !== null && typeof uri.index !== 'undefined') {
                trackIds.push('#', uri.index.toString());
            }
            return [URITypeMap.TRACKSET, encodeComponent(uri.name)].concat(trackIds);
        case URITypeMap.FACEBOOK:
            return [URIParticle.USER, URITypeMap.FACEBOOK, uri.uid];
        case URITypeMap.AUDIO_FILE:
            return [URITypeMap.AUDIO_FILE, uri.extension, uri.id];
        case URITypeMap.FOLDER:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.FOLDER,
                uri.id,
            ];
        case URITypeMap.FOLLOWERS:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.FOLLOWERS,
            ];
        case URITypeMap.FOLLOWING:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.FOLLOWING,
            ];
        case URITypeMap.PLAYLIST:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.PLAYLIST,
                uri.id,
            ];
        case URITypeMap.PLAYLIST_V2:
            return [URITypeMap.PLAYLIST, uri.id];
        case URITypeMap.STARRED:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.STARRED,
            ];
        case URITypeMap.TEMP_PLAYLIST:
            return [URITypeMap.TEMP_PLAYLIST, uri.origin, uri.data];
        case URITypeMap.CONTEXT_GROUP:
            return [URITypeMap.CONTEXT_GROUP, uri.origin, uri.name];
        case URITypeMap.USER_TOPLIST:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URIParticle.TOP,
                uri.toplist,
            ];
        // Legacy Toplist
        case URITypeMap.USER_TOP_TRACKS:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.TOPLIST,
            ];
        case URITypeMap.TOPLIST:
            return [URIParticle.TOP, uri.toplist].concat(uri.global || !uri.country
                ? [URIParticle.GLOBAL]
                : ['country', uri.country]);
        case URITypeMap.INBOX:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.INBOX,
            ];
        case URITypeMap.ROOTLIST:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.ROOTLIST,
            ];
        case URITypeMap.PUBLISHED_ROOTLIST:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.PUBLISHED_ROOTLIST,
            ];
        case URITypeMap.COLLECTION_TRACK_LIST:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.COLLECTION_TRACK_LIST,
                uri.id,
            ];
        case URITypeMap.PROFILE:
            if (uri.args && uri.args.length > 0) {
                return [URIParticle.USER, encodeComponent(uri.username, format)].concat(uri.args);
            }
            return [URIParticle.USER, encodeComponent(uri.username, format)];
        case URITypeMap.LOCAL_ARTIST:
            return [URITypeMap.LOCAL_TRACK, encodeComponent(uri.artist, format)];
        case URITypeMap.LOCAL_ALBUM:
            return [
                URITypeMap.LOCAL_TRACK,
                encodeComponent(uri.artist, format),
                encodeComponent(uri.album, format),
            ];
        case URITypeMap.LOCAL_TRACK:
            return [
                URITypeMap.LOCAL_TRACK,
                encodeComponent(uri.artist, format),
                encodeComponent(uri.album, format),
                encodeComponent(uri.track, format),
                uri.duration,
            ];
        case URITypeMap.LIBRARY:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.LIBRARY,
            ].concat(uri.category ? [uri.category] : []);
        case URITypeMap.IMAGE:
            return [URITypeMap.IMAGE, uri.id];
        case URITypeMap.MOSAIC:
            components = [];
            if (uri.ids) {
                components = uri.ids.slice(0);
            }
            components.unshift(URITypeMap.MOSAIC);
            return components;
        case URITypeMap.RADIO:
            components = [URITypeMap.RADIO];
            args = uri.args || [];
            for (i = 0, len = args.length; i < len; ++i)
                components.push(encodeComponent(args[i], format));
            return components;
        case URITypeMap.SPECIAL:
            components = [URITypeMap.SPECIAL];
            args = uri.args || [];
            for (i = 0, len = args.length; i < len; ++i)
                components.push(encodeComponent(args[i], format));
            return components;
        case URITypeMap.STATION:
            components = [URITypeMap.STATION];
            args = uri.args || [];
            for (i = 0, len = args.length; i < len; i++) {
                components.push(encodeComponent(args[i], format));
            }
            return components;
        case URITypeMap.APPLICATION:
            components = [URIParticle.APP, uri.id];
            args = uri.args || [];
            for (i = 0, len = args.length; i < len; ++i)
                components.push(encodeComponent(args[i], format));
            return components;
        case URITypeMap.COLLECTION_ALBUM:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.COLLECTION,
                URITypeMap.ALBUM,
                uri.id,
            ];
        case URITypeMap.COLLECTION_MISSING_ALBUM:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.COLLECTION,
                URITypeMap.ALBUM,
                uri.id,
                'missing',
            ];
        case URITypeMap.COLLECTION_ARTIST:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.COLLECTION,
                URITypeMap.ARTIST,
                uri.id,
            ];
        case URITypeMap.COLLECTION:
            return [
                URIParticle.USER,
                encodeComponent(uri.username, format),
                URITypeMap.COLLECTION,
            ].concat(uri.category ? [uri.category] : []);
        case URITypeMap.EPISODE: {
            let base62 = uri.id;
            if (uri.context || uri.play) {
                base62 += encodeQueryString({
                    context: uri.context,
                    play: uri.play,
                });
            }
            return [URITypeMap.EPISODE, base62];
        }
        case URITypeMap.SHOW:
            return [URITypeMap.SHOW, uri.id];
        case URITypeMap.LIVE:
            return [URITypeMap.LIVE, uri.id];
        case URITypeMap.CONCERT:
            return [URITypeMap.CONCERT, uri.id];
        case URITypeMap.SOCIAL_SESSION:
            return [URITypeMap.SOCIAL_SESSION, uri.id];
        case URITypeMap.INTERRUPTION:
            return [URITypeMap.INTERRUPTION, uri.id];
        default:
            throw new TypeError('Invalid Spotify URI!');
    }
}

import { URI_PREFIX, PLAY_HTTP_PREFIX, PLAY_HTTPS_PREFIX, OPEN_HTTP_PREFIX, OPEN_HTTPS_PREFIX, PATH_PREFIX, } from '../enums/prefix';
import { URIFormat } from '../enums/uri_format';
import { URITypeMap } from '../enums/uri_type';
import { URIParticle } from '../enums/uri_particle';
import * as factory from '../factories';
import { encodeComponent } from "./helpers";
function decodeQueryString(str) {
    return str.split('&').reduce((object, pair) => {
        const [key, value] = pair.split('=');
        object[key] = decodeURIComponent(value);
        return object;
    }, {});
}
/**
 * Decodes a component according to a URIformat.
 *
 * @param component - An encoded component string.
 * @param format - A URIformat.
 * @return An decoded component string.
 * @private
 */
function decodeComponent(component, format) {
    const part = format === URIFormat.URI ? component.replace(/\+/g, '%20') : component;
    return decodeURIComponent(part);
}
/**
 * Split an string URI or HTTP/HTTPS URL into components, skipping the prefix.
 *
 * @param strURI - A string URI to split.
 * @return SplittedURI The parsed URI.
 */
export function splitIntoComponents(strURI) {
    let components;
    let format;
    let query;
    let anchor;
    let str = strURI;
    const [_str, _params] = str.split('?');
    if (_params) {
        str = _str;
        const [_query, _anchor] = _params.split('#');
        if (_query) {
            query = decodeQueryString(_query);
            anchor = _anchor;
        }
    }
    const hashSplit = str.split('#');
    if (hashSplit.length > 1) {
        // first token
        str = hashSplit.shift();
        // last token
        anchor = hashSplit.pop();
    }
    if (str.indexOf(URI_PREFIX) === 0) {
        components = str.slice(URI_PREFIX.length).split(':');
        format = URIFormat.URI;
    }
    else {
        // For HTTP URLs, ignore any query string argument
        const [tempStr] = str.split('?');
        if (tempStr.indexOf(PLAY_HTTP_PREFIX) === 0) {
            components = tempStr.slice(PLAY_HTTP_PREFIX.length).split('/');
        }
        else if (tempStr.indexOf(PLAY_HTTPS_PREFIX) === 0) {
            components = tempStr.slice(PLAY_HTTPS_PREFIX.length).split('/');
        }
        else if (tempStr.indexOf(OPEN_HTTP_PREFIX) === 0) {
            components = tempStr.slice(OPEN_HTTP_PREFIX.length).split('/');
        }
        else if (tempStr.indexOf(OPEN_HTTPS_PREFIX) === 0) {
            components = tempStr.slice(OPEN_HTTPS_PREFIX.length).split('/');
        }
        else if (tempStr.indexOf(PATH_PREFIX) === 0) {
            components = tempStr.slice(PATH_PREFIX.length).split('/');
        }
        else {
            throw new TypeError('Invalid Spotify URI!');
        }
        format = URIFormat.URL;
    }
    if (anchor) {
        components.push(anchor);
    }
    return {
        format: format,
        components: components,
        query: query,
    };
}
/**
 * Parses the components of a URI into a real URI object.
 *
 * @param components - The components of the URI as a string array.
 * @param format - The format of the source string.
 * @param query - The query object.
 * @return The URI object.
 * @private
 */
export function parseFromComponents(components, format, query) {
    let _current = 0;
    const _getNextComponent = () => {
        const component = components[_current++];
        // Check that the URI component does not contain spaces.
        // <https://ghe.spotify.net/java/uri/blob/968046d026dcbe0a3d91dd11128005b2656a87d8/src/main/java/com/spotify/common/uri/SpotifyUriParser.java#L36>
        if (/\s/.test(component)) {
            throw new TypeError('Invalid Spotify URI!');
        }
        return component;
    };
    const _getIdComponent = () => {
        const component = _getNextComponent();
        if (!component || component.length > 22) {
            throw new TypeError('Invalid Spotify URI!');
        }
        return component;
    };
    const _getBase62IdComponent = () => {
        const component = _getNextComponent();
        if (!component || component.length !== 22) {
            throw new TypeError('Invalid Spotify URI!');
        }
        // Check that the supposedly base62 encoded ID only contains valid characters.
        // <https://ghe.spotify.net/java/uri/blob/master/src/main/java/com/spotify/common/uri/Base62.java#L26-L34>
        if (!/^[a-zA-Z0-9]+$/.test(component)) {
            throw new Error('Invalid ID');
        }
        return component;
    };
    const _getRemainingComponents = () => {
        return components.slice(_current);
    };
    const _getRemainingString = () => {
        const separator = format === URIFormat.URI ? ':' : '/';
        return components.slice(_current).join(separator);
    };
    const part = _getNextComponent();
    switch (part) {
        case '':
            break;
        case URITypeMap.ALBUM:
            return factory.albumURI(_getBase62IdComponent(), parseInt(_getNextComponent(), 10));
        case URITypeMap.AD:
            return factory.adURI(_getNextComponent());
        case URIParticle.APP: {
            const id = _getNextComponent();
            const decodedId = decodeComponent(id, format);
            if (encodeComponent(decodedId, format) !== id) {
                break;
            }
            const args = _getRemainingComponents();
            for (let i = 0, len = args.length; i < len; ++i)
                args[i] = decodeComponent(args[i], format);
            return factory.applicationURI(id, args);
        }
        case URITypeMap.ARTIST: {
            const id = _getBase62IdComponent();
            if (_getNextComponent() === URIParticle.TOP) {
                return factory.artistToplistURI(id, _getNextComponent());
            }
            return factory.artistURI(id);
        }
        case URITypeMap.AUDIO_FILE:
            return factory.audioFileURI(_getNextComponent(), _getNextComponent());
        case URITypeMap.DAILY_MIX:
            return factory.dailyMixURI(_getIdComponent());
        case URITypeMap.TEMP_PLAYLIST:
            return factory.temporaryPlaylistURI(_getNextComponent(), _getRemainingString());
        case URITypeMap.PLAYLIST:
            return factory.playlistV2URI(_getBase62IdComponent());
        case URITypeMap.SEARCH:
            return factory.searchURI(decodeComponent(_getRemainingString(), format));
        case URITypeMap.TRACK:
            return factory.trackURI(_getBase62IdComponent(), _getNextComponent(), query?.context, query?.play);
        case URITypeMap.TRACKSET: {
            const name = decodeComponent(_getNextComponent());
            let tracksArray = _getNextComponent();
            const hashSign = _getNextComponent();
            let index = parseInt(_getNextComponent(), 10);
            // Sanity check: %23 is URL code for "#"
            if (hashSign !== '%23' || isNaN(index)) {
                index = null;
            }
            const tracksetTracks = [];
            if (tracksArray) {
                tracksArray = decodeComponent(tracksArray).split(',');
                for (let i = 0, len = tracksArray.length; i < len; i++) {
                    const trackId = tracksArray[i];
                    tracksetTracks.push(factory.trackURI(trackId));
                }
            }
            return factory.tracksetURI(tracksetTracks, name, index);
        }
        case URITypeMap.CONTEXT_GROUP:
            return factory.contextGroupURI(_getNextComponent(), _getNextComponent());
        case URIParticle.TOP: {
            const type = _getNextComponent();
            if (_getNextComponent() === URIParticle.GLOBAL) {
                return factory.toplistURI(type, undefined, true);
            }
            return factory.toplistURI(type, _getNextComponent(), false);
        }
        case URIParticle.USER: {
            const username = decodeComponent(_getNextComponent(), format);
            const text = _getNextComponent();
            if (username === URITypeMap.FACEBOOK && text) {
                return factory.facebookURI(text);
            }
            else if (text) {
                switch (text) {
                    case URITypeMap.PLAYLIST:
                        return factory.playlistURI(username, _getBase62IdComponent());
                    case URITypeMap.FOLDER:
                        return factory.folderURI(username, _getIdComponent());
                    case URITypeMap.COLLECTION_TRACK_LIST:
                        return factory.collectionTrackListURI(username, _getIdComponent());
                    case URITypeMap.COLLECTION: {
                        const collectionItemType = _getNextComponent();
                        switch (collectionItemType) {
                            case URITypeMap.ALBUM: {
                                const id = _getIdComponent();
                                if (_getNextComponent() === 'missing') {
                                    return factory.collectionMissingAlbumURI(username, id);
                                }
                                return factory.collectionAlbumURI(username, id);
                            }
                            case URITypeMap.ARTIST:
                                return factory.collectionArtistURI(username, _getIdComponent());
                            default:
                                return factory.collectionURI(username, collectionItemType);
                        }
                    }
                    case URITypeMap.STARRED:
                        return factory.starredURI(username);
                    case URITypeMap.FOLLOWERS:
                        return factory.followersURI(username);
                    case URITypeMap.FOLLOWING:
                        return factory.followingURI(username);
                    case URIParticle.TOP:
                        return factory.userToplistURI(username, _getNextComponent());
                    case URITypeMap.INBOX:
                        return factory.inboxURI(username);
                    case URITypeMap.ROOTLIST:
                        return factory.rootlistURI(username);
                    case URITypeMap.PUBLISHED_ROOTLIST:
                        return factory.publishedRootlistURI(username);
                    case URITypeMap.TOPLIST:
                        // legacy toplist
                        return factory.userTopTracksURI(username);
                    case URITypeMap.LIBRARY:
                        return factory.libraryURI(username, _getNextComponent());
                    default:
                        break;
                }
            }
            const rem = _getRemainingComponents();
            if (text && rem.length > 0) {
                return factory.profileURI(username, [text].concat(rem));
            }
            else if (text) {
                return factory.profileURI(username, [text]);
            }
            else if (username) {
                return factory.profileURI(username);
            }
            throw new TypeError('Invalid Spotify URI!');
        }
        case URITypeMap.LOCAL_TRACK: {
            const artistNameComponent = _getNextComponent();
            const artistName = artistNameComponent && decodeComponent(artistNameComponent, format);
            const albumNameComponent = _getNextComponent();
            const albumName = albumNameComponent && decodeComponent(albumNameComponent, format);
            const trackNameComponent = _getNextComponent();
            const trackName = trackNameComponent && decodeComponent(trackNameComponent, format);
            const durationComponent = _getNextComponent();
            const duration = parseInt(durationComponent, 10);
            if (trackNameComponent !== undefined) {
                return factory.localURI(artistName, albumName, trackName, duration);
            }
            else if (albumNameComponent !== undefined) {
                return factory.localAlbumURI(artistName, albumName);
            }
            return factory.localArtistURI(artistName);
        }
        case URITypeMap.IMAGE:
            return factory.imageURI(_getIdComponent());
        case URITypeMap.MOSAIC:
            return factory.mosaicURI(components.slice(_current));
        case URITypeMap.RADIO:
            return factory.radioURI(_getRemainingString());
        case URITypeMap.SPECIAL: {
            const args = _getRemainingComponents();
            for (let i = 0, len = args.length; i < len; ++i)
                args[i] = decodeComponent(args[i], format);
            return factory.specialURI(args);
        }
        case URITypeMap.STATION:
            return factory.stationURI(_getRemainingComponents());
        case URITypeMap.EPISODE:
            return factory.episodeURI(_getBase62IdComponent(), query?.context, query?.play);
        case URITypeMap.SHOW:
            return factory.showURI(_getBase62IdComponent());
        case URITypeMap.LIVE:
            return factory.liveURI(_getIdComponent());
        case URITypeMap.CONCERT:
            return factory.concertURI(_getIdComponent());
        case URITypeMap.SOCIAL_SESSION:
            return factory.socialSessionURI(_getNextComponent());
        case URITypeMap.INTERRUPTION:
            return factory.interruptionURI(_getNextComponent());
        default:
            break;
    }
    throw new TypeError('Invalid or unknown Spotify URI!');
}
export function parse(uri) {
    const components = splitIntoComponents(uri);
    return parseFromComponents(components.components, components.format, components.query);
}

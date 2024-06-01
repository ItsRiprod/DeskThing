import { URIFormat } from './enums/uri_format';
import { URITypeMap } from './enums/uri_type';
import { OPEN_HTTPS_PREFIX } from './enums/prefix';
import { URIParticle } from './enums/uri_particle';
import { parse } from './_internal/parser';
import { getComponents } from './_internal/utils';
const _extend = typeof Object.assign === 'function'
    ? (t, e) => {
        Object.assign(t, e);
    }
    : (t, e) => {
        for (const k in e) {
            if (!e.hasOwnProperty(k)) {
                continue;
            }
            t[k] = e[k];
        }
    };
class URIImpl {
    hasBase62Id;
    type;
    /**
     * Creates a new URI object of a specified type and with props.
     *
     * @param type - The type of this URI
     * @param props - An object containing the properties from this object
     */
    constructor(type, props = {}) {
        this.type = type;
        this.hasBase62Id = !!props.hasBase62Id;
        _extend(this, props);
    }
    toURI() {
        const components = getComponents(this, URIFormat.URI);
        return `spotify:${components.join(':')}`;
    }
    toString() {
        return this.toURI();
    }
    toURLPath(leadingSlash = false) {
        let components = getComponents(this, URIFormat.URL);
        if (components[0] === URIParticle.APP) {
            components.shift();
        }
        // Some URIs are allowed to have empty components. It should be investigated
        // whether we need to strip empty components at all from any URIs. For now,
        // we check specifically for tracksets and local tracks and strip empty
        // components for all other URIs.
        //
        // For tracksets, it's permissible to have a path that looks like
        // 'trackset//trackURI' because the identifier parameter for a trackset can
        // be blank. For local tracks, some metadata can be missing, like missing
        // album name would be 'spotify:local:artist::track:duration'.
        const isTrackset = components[0] === URITypeMap.TRACKSET;
        const isLocalTrack = components[0] === URITypeMap.LOCAL_TRACK;
        const shouldStripEmptyComponents = !isTrackset && !isLocalTrack;
        if (shouldStripEmptyComponents) {
            const _temp = [];
            for (let i = 0, l = components.length; i < l; i++) {
                const component = components[i];
                if (!!component) {
                    _temp.push(component);
                }
            }
            components = _temp;
        }
        const path = components.join('/');
        return leadingSlash ? `/${path}` : path;
    }
    getPath() {
        return this.toString().replace(/[#?].*/, '');
    }
    toURL() {
        return OPEN_HTTPS_PREFIX + this.toURLPath();
    }
    clone() {
        return new URIImpl(this.type, this);
    }
}
export function createURI(type, props) {
    return new URIImpl(type, props);
}
/**
 * Creates a new URI object from a parsed string argument.
 *
 * @param uri - The string that will be parsed into a URI object.
 * @return The parsed URI object.
 * @throws TypeError If the string argument is not a valid URI, a TypeError will
 *   be thrown.
 */
export function parseURIFromString(uri) {
    if (typeof uri !== 'string') {
        throw new TypeError('Argument `uri` must be a string.');
    }
    return parse(uri);
}
export function parseURI(maybeURI, allowedTypes) {
    if (!maybeURI) {
        return null;
    }
    if (maybeURI instanceof URIImpl) {
        if (allowedTypes?.indexOf(maybeURI.type) === -1) {
            return null;
        }
        return maybeURI.clone();
    }
    if (typeof maybeURI === 'string') {
        try {
            const parsed = parseURIFromString(maybeURI);
            if (allowedTypes?.indexOf(parsed.type) === -1) {
                return null;
            }
            return parsed;
        }
        catch {
            return null;
        }
    }
    if (maybeURI?.type) {
        if (allowedTypes?.indexOf(maybeURI.type) === -1) {
            return null;
        }
        const { type, ...props } = maybeURI;
        return new URIImpl(type, props);
    }
    return null;
}
/**
 * Returns the HEX encoded version of the Base62 ID
 *
 * @param uri - The target URI.
 * @return The ID hex-encoded
 */
/*export function getURIHexId(uri: URI & {id?: string}): string | null {
  return uri.hasBase62Id && uri.id ? idToHex(uri.id) : null;
}*/ // maybe wasn't used, so treeshaken??

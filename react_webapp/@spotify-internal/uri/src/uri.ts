import {URIFormat} from './enums/uri_format';
import {URIType, URITypeMap} from './enums/uri_type';
import {OPEN_HTTPS_PREFIX} from './enums/prefix';
import {URIParticle} from './enums/uri_particle';

import {TypedURI} from './uri_typedefs';
import {parse} from './_internal/parser';
import {getComponents} from './_internal/utils';
// import {idToHex} from './utils';
declare global {
  interface ObjectConstructor {
    assign<T, U>(target: T, source: U): T & U;
  }
}

export interface URI extends URIProps {
  readonly hasBase62Id: boolean;
  readonly type: URIType;

  /**
   * Returns the URI representation of this URI.
   *
   * @return The URI representation of this uri.
   */
  toURI(): string;

  /**
   * Returns the String representation of this URI.
   *
   * @return The URI representation of this uri.
   * @see {URI#toURI}
   */
  toString(): string;

  /**
   * Get the URL path of this uri.
   *
   * @param leadingSlash - True if a leading slash should be prepended.
   * @return The path of this uri.
   */
  toURLPath(leadingSlash?: boolean): string;

  getPath(): string;

  /**
   * Returns the URL string for the uri, using the default web-player host
   * (https://open.spotify.com).
   *
   * @return The URL string for the uri.
   */
  toURL(): string;

  /**
   * Clones a given URI instance.
   *
   * @param uri - The uri to clone.
   * @return An instance of TypedURI.
   */
  clone(): TypedURI;
}

type URIProps = Record<string, any>;
type URIExtended<T extends URIType, P extends URIProps> = URI &
  P & {
    type: T;
  };

const _extend: (t: Record<string, any>, e: Record<string, any>) => void =
  typeof Object.assign === 'function'
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

class URIImpl implements URI {
  readonly hasBase62Id: boolean;
  readonly type: URIType;

  /**
   * Creates a new URI object of a specified type and with props.
   *
   * @param type - The type of this URI
   * @param props - An object containing the properties from this object
   */
  constructor(type: URIType, props: URIProps = {}) {
    this.type = type;
    this.hasBase62Id = !!props.hasBase62Id;
    _extend(this, props);
  }

  toURI(): string {
    const components = getComponents(this as TypedURI, URIFormat.URI);
    return `spotify:${components.join(':')}`;
  }

  toString(): string {
    return this.toURI();
  }

  toURLPath(leadingSlash: boolean = false): string {
    let components = getComponents(this as TypedURI, URIFormat.URL);
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

  getPath(): string {
    return this.toString().replace(/[#?].*/, '');
  }

  toURL(): string {
    return OPEN_HTTPS_PREFIX + this.toURLPath();
  }

  clone(): TypedURI {
    return new URIImpl(this.type as URIType, this) as TypedURI;
  }
}

export function createURI<T extends URIType, P extends URIProps>(
  type: T,
  props: P
): URIExtended<T, P> {
  return new URIImpl(type, props) as URIExtended<T, P>;
}

/**
 * Creates a new URI object from a parsed string argument.
 *
 * @param uri - The string that will be parsed into a URI object.
 * @return The parsed URI object.
 * @throws TypeError If the string argument is not a valid URI, a TypeError will
 *   be thrown.
 */
export function parseURIFromString(uri: string): TypedURI {
  if (typeof uri !== 'string') {
    throw new TypeError('Argument `uri` must be a string.');
  }
  return parse(uri) as TypedURI;
}

/**
 * Parses a given object into a URI instance.
 *
 * Unlike parseURIFromString, this function could receive any kind of value. If
 * the value is already a URI instance, it is simply returned. Otherwise the
 * value will be stringified before parsing.
 *
 * This function also does not throw an error like parseURIFromString, but
 * instead simply returns null if it can't parse the value.
 *
 * @param maybeURI - The value to parse.
 * @param allowedTypes - An optional array of `URITypeMap` values that are used
 *   to narrow down the types. If the type of the parsed item does not match any
 *   of the values in the array, the function will return null instead.
 * @return The corresponding URI instance, or null if the passed value is not a
 *   valid value.
 */
export function parseURI(maybeURI?: null | undefined | ''): null;
export function parseURI<T extends TypedURI>(maybeURI?: T): T;
export function parseURI<T extends {type: URIType}>(
  maybeURI?: T
): Extract<TypedURI, {type: T['type']}> | null;
export function parseURI<T extends URIType>(
  maybeURI?: URI | {type: URIType} | string | null,
  allowedTypes?: T[]
): Extract<TypedURI, {type: T}> | null;
export function parseURI(
  maybeURI?: URI | {type: URIType} | string | null,
  allowedTypes?: URIType[]
): TypedURI | null {
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
    } catch {
      return null;
    }
  }
  if (maybeURI?.type) {
    if (allowedTypes?.indexOf(maybeURI.type) === -1) {
      return null;
    }
    const {type, ...props} = maybeURI;
    return new URIImpl(type, props) as TypedURI;
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

import { URIFormat } from '../enums/uri_format';
/**
 * Encodes a component according to a URIformat.
 *
 * @param component - A component string.
 * @param format - A URIformat.
 * @return An encoded component string.
 */
export function encodeComponent(component, format) {
    if (!component) {
        return '';
    }
    let encodedComponent = encodeURIComponent(component);
    if (format === URIFormat.URI) {
        encodedComponent = encodedComponent.replace(/%20/g, '+');
    }
    // encode characters that are not encoded by default by encodeURIComponent
    // but that the Spotify URI spec encodes: !'*()
    encodedComponent = encodedComponent.replace(/[!'()]/g, escape);
    encodedComponent = encodedComponent.replace(/\*/g, '%2A');
    return encodedComponent;
}
export function decodeComponent(component, format) {
    if (!component) {
        return '';
    }
    const part = format === URIFormat.URI ? component.replace(/\+/g, '%20') : component;
    return decodeURIComponent(part);
}

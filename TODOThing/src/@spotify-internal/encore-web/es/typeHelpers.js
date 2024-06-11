import { color as colorTokens } from '../../encore-foundation'; // Helper for any prop that behaves like `as` from styled-components (ie `component` in Button)

// eslint-disable-next-line
export function assertNever(_) {
  throw new Error('Unreachable value');
}
/**
 * Export Foundation tokens
 *
 * TODO: If Foundation merges this PR (https://ghe.spotify.net/encore/foundation/pull/239),
 * remove and re-export from Foundation.
 */

// Helper for validating whether a color string is a foundation token
export function isColorToken(color) {
  return color !== undefined && colorTokens.hasOwnProperty(color);
}
/**
 * Helper for converting a token (in string px format) to an integer.
 * @example
 * pxToInt(spacer16) // returns 16
 *  */

export var pxToInt = function pxToInt(px) {
  return parseInt(px, 10);
};
/**
 * Construct a type with the properties of T except for those in type K.
 *
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-5.html#the-omit-helper-type
 * Included to support library consumers on TypeScript versions prior to 3.5.
 * (Also, can't require TypeScript as dependency to continue supporting JS packages).
 *
 * TODO: Remove and add an optional dependency for Typescript version 3.5+.
 */
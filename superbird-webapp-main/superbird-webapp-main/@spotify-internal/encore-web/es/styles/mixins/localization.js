import { css } from 'styled-components';
/* Apply this mixin to elements with `display: flex` or `display: inline-flex` applied to properly
   support the break-word behavior (i.e. it will break long words only when absolutely necessary).
   We can transition to just applying `break-word: anywhere` once it is supported by Safari, but
   until then, this mixin allows us to fall back to the deprecated-but-supported `word-break`
   solution instead.
   
   For non-flex-container elements, apply `overflow-wrap: break-word'` directly instead.
*/

export var overflowWrapFlexText = function overflowWrapFlexText() {
  return css(["@supports (overflow-wrap:anywhere){overflow-wrap:anywhere;}@supports not (overflow-wrap:anywhere){word-break:break-word;}"]);
};
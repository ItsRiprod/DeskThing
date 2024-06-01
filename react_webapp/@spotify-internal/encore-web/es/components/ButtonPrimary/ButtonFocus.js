import styled from 'styled-components';
import { buttonBorderRadius, focusGapBorderStyle } from "../../styles";

/* ButtonFocus contains ButtonPrimary's focus state, which is themed using the color set
 * of ButtonPrimary's _parent_, and not the colorSet of ButtonPrimary itself.
 * ButtonFocus is always in the DOM, but is invisible unless the button focused & isUsingKeyboard is true
 */
export var ButtonFocus = styled.span.withConfig({
  displayName: "ButtonFocus",
  componentId: "sc-2hq6ey-0"
})(["", ""], function (props) {
  return props.isUsingKeyboard && focusGapBorderStyle(buttonBorderRadius);
});
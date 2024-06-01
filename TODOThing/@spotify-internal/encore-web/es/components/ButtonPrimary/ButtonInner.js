import styled, { css } from 'styled-components';
import { buttonBorderRadius, buttonHeightMinimum, cssColorSet, getButtonPadding, overflowWrapFlexText, rootStyle } from "../../styles";

/* ButtonInner contains styles that make the button look like a button,
 * and is the Button subcomponent that is themable using ButtonPrimary's colorSet prop
 */
export var ButtonInner = styled.span.withConfig({
  displayName: "ButtonInner",
  componentId: "sc-14ud5tc-0"
})(["", ";", ""], function (_ref) {
  var UNSAFE_colorSet = _ref.UNSAFE_colorSet;
  return UNSAFE_colorSet ? cssColorSet(UNSAFE_colorSet) : '';
}, function (_ref2) {
  var fallbackSet = _ref2.fallbackSet,
      buttonSize = _ref2.buttonSize,
      iconLeading = _ref2.iconLeading,
      iconTrailing = _ref2.iconTrailing,
      iconOnly = _ref2.iconOnly,
      status = _ref2.status;
  var padding = getButtonPadding(buttonSize, iconLeading, iconTrailing, iconOnly, undefined, status);
  return css(["", ";position:relative;background-color:var(--background-base,", ");color:var(--text-base,", ");display:flex;border-radius:", ";font-size:inherit;min-block-size:", ";align-items:center;justify-content:center;", ";", ";"], rootStyle(), fallbackSet.background.base, fallbackSet.text.base, buttonBorderRadius, buttonHeightMinimum[buttonSize], padding, overflowWrapFlexText());
});
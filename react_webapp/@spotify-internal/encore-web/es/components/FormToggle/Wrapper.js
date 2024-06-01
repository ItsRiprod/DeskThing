import { spacer16, spacer20 } from '@spotify-internal/encore-foundation';
import styled, { css } from 'styled-components';
import { cssColorValue, cursorDisabled, focusBorderWidth, focusGapBorder, opacityActive, opacityDisabled, semanticColors } from "../../styles";
import { Indicator } from "./Indicator";
var borderRadius = 11;
var wrapperWidth = '30px';
export var Wrapper = styled.span.withConfig({
  displayName: "Wrapper",
  componentId: "sc-16y5c87-0"
})(["", ""], function (props) {
  // checked means toggle is in the "on" position
  var checkedStyles = css(["background-color:", ";", "{right:2px;left:auto;[dir='rtl'] &{right:auto;left:2px;}}"], cssColorValue(props.semanticColor), Indicator); // unchecked means toggle is in the "off" position

  var uncheckedStyles = css(["background-color:", ";", "{left:2px;right:auto;[dir='rtl'] &{right:2px;left:auto;}}"], cssColorValue(semanticColors.essentialSubdued), Indicator);
  var focusStyles = css(["&::after{border-color:", ";}"], cssColorValue(semanticColors.essentialBase));
  var activeStyles = css(["opacity:", ";", "{inline-size:", ";}"], opacityActive, Indicator, spacer20);
  var disabledStyles = css(["opacity:", ";cursor:", ";"], opacityDisabled, cursorDisabled);
  return css(["border-radius:", "px;block-size:", ";position:relative;min-inline-size:", ";", ";input:focus ~ &{", "}", " input:active ~ &{", "}", " input:disabled ~ &{", "}input:not(:checked) ~ &{", "}input:checked ~ &{", "}"], borderRadius, spacer16, wrapperWidth, focusGapBorder("".concat(borderRadius + focusBorderWidth, "px"), props.isUsingKeyboard), focusStyles, props.isFocus && css(["input ~ &{", "}"], focusStyles), activeStyles, props.isActive && css(["input ~ &{", "}"], activeStyles), disabledStyles, uncheckedStyles, checkedStyles);
});
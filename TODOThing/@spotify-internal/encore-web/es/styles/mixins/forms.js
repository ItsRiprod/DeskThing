/* stylelint-disable no-descending-specificity */
//
// Forms
// --------------------------------------------------
import { spacer4, spacer8, spacer16, spacer32, spacer48 } from '@spotify-internal/encore-foundation';
import { css } from 'styled-components';
import { cssColorValue, semanticColors } from "../semantic-theme";
import { opacityDisabled } from "../variables";
import { rootStyle } from "./baseline";
import { ballad } from "./type"; // Shared styles for inputs, textareas, selects

export var formControlBase = function formControlBase(useBrowserDefaultFocusStyle) {
  return css(["-webkit-appearance:none;background-image:none;border:0;display:block;", ";transition:box-shadow ease-in-out 0.1s,color ease-in-out 0.1s;inline-size:100%;min-block-size:", ";&::placeholder{opacity:1;}", " &:disabled{cursor:not-allowed;opacity:1;}"], ballad(), spacer48, !useBrowserDefaultFocusStyle && css(["&:focus,&:hover:focus{outline:0;}"]));
}; // Styles for selects only

export var formControlBaseSelect = function formControlBaseSelect() {
  return css(["", ";margin-block-start:0;margin-block-end:0;appearance:none;box-shadow:none;text-indent:0.01px;text-overflow:'';&::-ms-expand{display:none;}border-radius:", ";padding-block-start:", ";padding-block-end:", ";padding-inline-start:14px;padding-inline-end:44px;"], rootStyle(), spacer4, spacer8, spacer8);
}; // Styles the down arrow icon on FormSelect and Dropdown

export var formChevronDown = function formChevronDown() {
  return css(["color:", ";pointer-events:none;position:absolute;right:14px;[dir='rtl'] &{left:14px;right:auto;}"], cssColorValue(semanticColors.essentialSubdued));
}; // Shared styles for radios + checkboxes

export var formCheck = function formCheck() {
  return css(["", ";align-items:center;display:flex;padding-block-end:", ";padding-block-start:", ";position:relative;min-block-size:", ";"], rootStyle(), spacer4, spacer4, spacer32);
};
export var formCheckIndicator = function formCheckIndicator(radius) {
  return css(["", ";background:transparent;border-radius:", ";display:inline-block;block-size:", ";position:relative;user-select:none;inline-size:", ";flex-shrink:0;align-self:flex-start;top:0;"], rootStyle(), radius, spacer16, spacer16);
};
export var formControlTheme = function formControlTheme(_ref) {
  var _ref$isUsingKeyboard = _ref.isUsingKeyboard,
      isUsingKeyboard = _ref$isUsingKeyboard === void 0 ? true : _ref$isUsingKeyboard,
      isHover = _ref.isHover,
      isFocus = _ref.isFocus,
      useBrowserDefaultFocusStyle = _ref.useBrowserDefaultFocusStyle,
      error = _ref.error;
  var hoverStyles = css(["box-shadow:inset 0 0 0 1px ", ";"], cssColorValue(semanticColors.essentialBase));
  var focusStyles = css(["box-shadow:inset 0 0 0 ", "px ", ";"], isUsingKeyboard ? 3 : 1.5, cssColorValue(semanticColors.essentialBase));
  var errorStyles = css(["&,&:hover{box-shadow:inset 0 0 0 1px ", ";}&:focus{box-shadow:inset 0 0 0 ", "px ", ";}"], cssColorValue(semanticColors.essentialNegative), isUsingKeyboard ? 3 : 1.5, cssColorValue(semanticColors.essentialNegative));
  return css(["background-color:", ";box-shadow:inset 0 0 0 1px ", ";color:", ";&:hover,&[readonly]:hover{", "}", " &:focus,&[readonly]:focus{", "}&&{", ";}&::placeholder{color:", ";}&:disabled{opacity:", ";box-shadow:inset 0 0 0 1px ", ";}&[readonly]{box-shadow:inset 0 0 0 1px ", ";}&:invalid{", ";}", ""], cssColorValue(semanticColors.backgroundBase), cssColorValue(semanticColors.essentialSubdued), cssColorValue(semanticColors.textBase), hoverStyles, isHover && hoverStyles, !useBrowserDefaultFocusStyle && focusStyles, isFocus && !useBrowserDefaultFocusStyle && focusStyles, cssColorValue(semanticColors.textSubdued), opacityDisabled, cssColorValue(semanticColors.essentialSubdued), cssColorValue(semanticColors.decorativeSubdued), error === undefined && errorStyles, error && errorStyles);
};
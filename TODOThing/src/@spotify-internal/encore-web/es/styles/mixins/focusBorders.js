import { css } from 'styled-components';
import { cssColorValue, semanticColors } from "../semantic-theme";
export var focusBorderWidth = 3;
export var focusMargin = -(focusBorderWidth * 2);
export var focusBorderColor = cssColorValue(semanticColors.essentialBase);
export var focusTransitionFade = '200ms';
export var focusTransitionType = 'ease-in';
/**
 * Removes default browser focus style.
 * Should be applied regardless of whether or not we are showing visible focus states.
 * */

export var browserFocusReset = css(["&:focus{outline:none;}"]);
export function getFocusDimensionsAndPosition() {
  var dimension = "".concat(focusBorderWidth * 4, "px");
  var position = "-".concat(focusBorderWidth * 2, "px");
  return {
    dimension: dimension,
    position: position
  };
}
export var focusDimensionsAndPosition = function focusDimensionsAndPosition() {
  var _getFocusDimensionsAn = getFocusDimensionsAndPosition(),
      dimension = _getFocusDimensionsAn.dimension,
      position = _getFocusDimensionsAn.position;

  return css(["inline-size:", ";block-size:", ";top:", ";left:", ";"], "calc(100% + ".concat(dimension, ")"), "calc(100% + ".concat(dimension, ")"), position, position);
};
export var absoluteBorder = function absoluteBorder() {
  var margin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : focusMargin;
  return css(["position:absolute;top:", "px;left:", "px;right:", "px;bottom:", "px;"], margin, margin, margin, margin);
};
/** Base styles included in both `focusGapBorderStyle` and  `focusBottomBorderStyle` */

export var focusBorderBaseStyle = css(["display:block;position:absolute;pointer-events:none;transition:border-color ", " ", ";box-sizing:border-box;"], focusTransitionFade, focusTransitionType);
/** Can be added to a child element or pseudoelement to apply an invisible border that doesn't affect box sizing
 *  When focused, add a color to the border to make it appear */

export var focusGapBorderStyle = function focusGapBorderStyle(borderRadius) {
  return css(["", " ", " background:transparent;border-radius:", ";border:", "px solid transparent;"], focusBorderBaseStyle, focusDimensionsAndPosition(), borderRadius, focusBorderWidth);
};
/** Can be added to a child element or pseudoelement to apply an invisible border that doesn't affect box sizing
 *  When focused, add a color to the border to make it appear */

export var focusBottomBorderStyle = function focusBottomBorderStyle(bottomBase) {
  return css(["", " bottom:", "px;border-bottom:", "px solid transparent;width:100%;"], focusBorderBaseStyle, bottomBase - focusBorderWidth * 2, focusBorderWidth);
};
/** Mixin that applies a gap-style focus border to a pseudo element */

export var focusGapBorder = function focusGapBorder(borderRadius) {
  var isUsingKeyboard = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var showUsingProp = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return css(["position:relative;", " ", ""], browserFocusReset, isUsingKeyboard && css(["&::after{", " content:'';}&:focus::after{border-color:", ";}", ""], focusGapBorderStyle(borderRadius), focusBorderColor, showUsingProp && css(["&::after{border-color:", ";}"], focusBorderColor)));
};
/** Mixin that applies a bottom-border style focus state to a pseudo element */

export var focusBottomBorder = function focusBottomBorder() {
  var bottomBase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var isUsingKeyboard = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var showUsingProp = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return css(["position:relative;", " ", ""], browserFocusReset, isUsingKeyboard && css(["&::after{content:'';", "}&:focus::after{border-color:inherit;}", ""], focusBottomBorderStyle(bottomBase), showUsingProp && css(["&::after{border-color:inherit;}"])));
};
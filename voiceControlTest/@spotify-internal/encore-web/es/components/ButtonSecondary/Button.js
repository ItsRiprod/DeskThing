import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
var _excluded = ["component", "semanticColor", "buttonSize", "hover", "active", "focus", "isUsingKeyboard", "useBrowserDefaultFocusStyle", "status", "fullWidth", "iconLeading", "iconTrailing", "iconOnly"];
import React from 'react';
import styled, { css } from 'styled-components';
import { buttonBorderRadius, buttonHeightMinimum, buttonStylesActive, buttonStylesBase, buttonStylesDisabled, buttonStylesHover, cssColorValue, focusGapBorder, getButtonPadding, overflowWrapFlexText, semanticColors } from "../../styles";
export var borderWidth = 1;

var getBorderColors = function getBorderColors(semanticColor) {
  var borderDefaultColor;
  var borderHoverColor;

  switch (semanticColor) {
    case semanticColors.textAnnouncement:
    case semanticColors.textBrightAccent:
    case semanticColors.textNegative:
    case semanticColors.textPositive:
    case semanticColors.textSubdued:
    case semanticColors.textWarning:
      borderDefaultColor = borderHoverColor = semanticColor;
      break;

    default:
      // includes textBase
      borderDefaultColor = semanticColors.essentialSubdued;
      borderHoverColor = semanticColors.essentialBase;
      break;
  }

  return {
    borderDefaultColor: cssColorValue(borderDefaultColor),
    borderHoverColor: cssColorValue(borderHoverColor)
  };
};

export var Button = styled( /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var _ref$component = _ref.component,
      Component = _ref$component === void 0 ? 'button' : _ref$component,
      semanticColor = _ref.semanticColor,
      buttonSize = _ref.buttonSize,
      hover = _ref.hover,
      active = _ref.active,
      focus = _ref.focus,
      isUsingKeyboard = _ref.isUsingKeyboard,
      useBrowserDefaultFocusStyle = _ref.useBrowserDefaultFocusStyle,
      status = _ref.status,
      fullWidth = _ref.fullWidth,
      iconLeading = _ref.iconLeading,
      iconTrailing = _ref.iconTrailing,
      iconOnly = _ref.iconOnly,
      props = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/React.createElement(Component, Object.assign({}, props, {
    ref: ref
  }));
})).withConfig({
  displayName: "Button",
  componentId: "y0gtbx-0"
})(["", ""], function (_ref2) {
  var buttonSize = _ref2.buttonSize,
      _ref2$semanticColor = _ref2.semanticColor,
      semanticColor = _ref2$semanticColor === void 0 ? semanticColors.textBase : _ref2$semanticColor,
      hover = _ref2.hover,
      active = _ref2.active,
      focus = _ref2.focus,
      useBrowserDefaultFocusStyle = _ref2.useBrowserDefaultFocusStyle,
      status = _ref2.status,
      isUsingKeyboard = _ref2.isUsingKeyboard,
      fullWidth = _ref2.fullWidth,
      iconLeading = _ref2.iconLeading,
      iconTrailing = _ref2.iconTrailing,
      iconOnly = _ref2.iconOnly;

  var _getBorderColors = getBorderColors(semanticColor),
      borderDefaultColor = _getBorderColors.borderDefaultColor,
      borderHoverColor = _getBorderColors.borderHoverColor;

  var hoverStyles = css(["", " border-color:", ";", ""], !fullWidth && buttonStylesHover, borderHoverColor, semanticColor === 'textSubdued' && css(["color:", ";"], cssColorValue(semanticColors.textBase)));
  var activeStyles = css(["", " border-color:", ";"], buttonStylesActive, borderDefaultColor);
  var disabledStyles = css(["", " border-color:", ";&::after{border-color:transparent;}"], buttonStylesDisabled, borderDefaultColor);
  var padding = getButtonPadding(buttonSize, iconLeading, iconTrailing, iconOnly, borderWidth);
  return css(["", ";", " ", ";border:", "px solid ", ";color:", ";min-line-size:0;min-block-size:", ";", ";", " ", " &:hover{", ";}", " &:active{", ";}", " &[disabled],&[aria-disabled='true'],fieldset[disabled] &{", ";}"], buttonStylesBase(buttonSize, useBrowserDefaultFocusStyle, status), padding, !useBrowserDefaultFocusStyle && focusGapBorder(buttonBorderRadius, isUsingKeyboard, focus), borderWidth, borderDefaultColor, cssColorValue(semanticColor), buttonHeightMinimum[buttonSize], overflowWrapFlexText(), fullWidth && css(["inline-size:100%;"]), (fullWidth || iconLeading || iconTrailing) && css(["&&{display:inline-flex;align-items:center;justify-content:center;}"]), hoverStyles, hover && hoverStyles, activeStyles, active && activeStyles, disabledStyles);
});
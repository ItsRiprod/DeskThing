import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
var _excluded = ["component", "buttonSize", "hover", "active", "focus", "fallbackSet", "colorSet", "useBrowserDefaultFocusStyle", "status", "fullWidth", "UNSAFE_colorSet"];
import React from 'react';
import styled, { css } from 'styled-components';
import { buttonStylesBase, buttonStylesDisabled, buttonStylesHover, focusBorderColor } from "../../styles";
import { ButtonFocus } from "./ButtonFocus";
import { ButtonInner } from "./ButtonInner";
/* Button renders the <button> element (by default), which is reset to contain minimal styling.
 * Most styling is applied to Button's internal subcomponents - ButtonInner and ButtonFocus.
 */

export var Button = styled( /*#__PURE__*/React.forwardRef(function Button(_ref, ref) {
  var _ref$component = _ref.component,
      Component = _ref$component === void 0 ? 'button' : _ref$component,
      buttonSize = _ref.buttonSize,
      hover = _ref.hover,
      active = _ref.active,
      focus = _ref.focus,
      fallbackSet = _ref.fallbackSet,
      colorSet = _ref.colorSet,
      useBrowserDefaultFocusStyle = _ref.useBrowserDefaultFocusStyle,
      status = _ref.status,
      fullWidth = _ref.fullWidth,
      UNSAFE_colorSet = _ref.UNSAFE_colorSet,
      props = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/React.createElement(Component, Object.assign({}, props, {
    ref: ref
  }));
})).withConfig({
  displayName: "Button",
  componentId: "qlcn5g-0"
})(["", ""], function (_ref2) {
  var fallbackSet = _ref2.fallbackSet,
      useBrowserDefaultFocusStyle = _ref2.useBrowserDefaultFocusStyle,
      status = _ref2.status,
      buttonSize = _ref2.buttonSize,
      fullWidth = _ref2.fullWidth,
      hover = _ref2.hover,
      active = _ref2.active,
      focus = _ref2.focus;
  var disabledStyles = css(["", "{", ";background-color:var(--background-base,", ");color:var(--text-base,", ");}", "{border-color:transparent;}"], ButtonInner, buttonStylesDisabled, fallbackSet.background.base, fallbackSet.text.base, ButtonFocus);
  var activeStyles = css(["", "{background-color:var(--background-press,", ");box-shadow:none;transform:scale(1);}", "{transform:scale(1);}"], ButtonInner, fallbackSet.background.press, ButtonFocus);
  var hoverStyles = css(["", " ", "{background-color:var(--background-highlight,", ");}"], !fullWidth && css(["", ",", "{", "}"], ButtonInner, ButtonFocus, buttonStylesHover), ButtonInner, fallbackSet.background.highlight);
  var focusStyles = css(["", "{border-color:", ";}"], ButtonFocus, focusBorderColor);
  return css(["", ";padding:0;min-inline-size:0;align-self:center;", " &:hover{", ";}", " &:active{", ";}", " &:focus{", ";}", " &[disabled],&[aria-disabled='true'],fieldset[disabled] &{", "}"], buttonStylesBase(buttonSize, useBrowserDefaultFocusStyle, status), fullWidth && css(["inline-size:100%;"]), hoverStyles, hover && css(["&&{", "}"], hoverStyles), activeStyles, active && css(["&&{", "}"], activeStyles), focusStyles, focus && css(["&&{", "}"], focusStyles), disabledStyles);
});
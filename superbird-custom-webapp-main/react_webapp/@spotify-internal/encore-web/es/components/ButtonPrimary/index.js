import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
var _excluded = ["component", "colorSet", "buttonSize", "fullWidth", "iconLeading", "iconTrailing", "iconOnly", "children", "className", "UNSAFE_colorSet", "aria-label", "aria-labelledby"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

import React, { useContext } from 'react';
import { BrowserDefaultFocusStyleContext } from "../../contexts/BrowserDefaultFocusStyleContext";
import { EncoreContext, encoreContextKeyword, getStatus } from "../../contexts/EncoreContext";
import { KeyboardDetectionContext } from "../../contexts/KeyboardDetectionContext";
import { addColorSet, buttonSizes, defaultTheme } from "../../styles";
import { Button } from "./Button";
import { ButtonChildren } from "./ButtonChildren";
import { ButtonFocus } from "./ButtonFocus";
import { ButtonInner } from "./ButtonInner";
var ButtonComponent = /*#__PURE__*/React.forwardRef(function ButtonComponent(_ref, ref) {
  var component = _ref.component,
      _ref$colorSet = _ref.colorSet,
      colorSet = _ref$colorSet === void 0 ? 'brightAccent' : _ref$colorSet,
      _ref$buttonSize = _ref.buttonSize,
      buttonSize = _ref$buttonSize === void 0 ? 'md' : _ref$buttonSize,
      fullWidth = _ref.fullWidth,
      iconLeading = _ref.iconLeading,
      iconTrailing = _ref.iconTrailing,
      iconOnly = _ref.iconOnly,
      children = _ref.children,
      className = _ref.className,
      UNSAFE_colorSet = _ref.UNSAFE_colorSet,
      ariaLabel = _ref['aria-label'],
      ariaLabelledby = _ref['aria-labelledby'],
      props = _objectWithoutProperties(_ref, _excluded);

  if (iconOnly && !ariaLabel && !ariaLabelledby) {
    // eslint-disable-next-line no-console
    console.warn('ButtonPrimary must have an aria-label or aria-labelledby attribute defined when using the iconOnly prop in order to be accessible.');
  }

  var _useContext = useContext(KeyboardDetectionContext),
      isUsingKeyboard = _useContext.isUsingKeyboard;

  var _useContext2 = useContext(BrowserDefaultFocusStyleContext),
      useBrowserDefaultFocusStyle = _useContext2.useBrowserDefaultFocusStyle;

  var config = useContext(EncoreContext);
  var status = getStatus(encoreContextKeyword.button, config);
  var rel = props.href && props.target === '_blank' ? 'noopener noreferrer' : null;
  var fallbackSet = defaultTheme[colorSet];
  return /*#__PURE__*/React.createElement(Button, Object.assign({}, props, {
    rel: rel,
    ref: ref,
    component: !component && props.href ? 'a' : component,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    buttonSize: buttonSize,
    fullWidth: fullWidth,
    fallbackSet: fallbackSet,
    useBrowserDefaultFocusStyle: useBrowserDefaultFocusStyle,
    status: status
  }), /*#__PURE__*/React.createElement(ButtonInner, {
    className: UNSAFE_colorSet ? className : addColorSet(colorSet, className),
    fullWidth: fullWidth,
    iconLeading: iconLeading,
    iconTrailing: iconTrailing,
    iconOnly: iconOnly,
    UNSAFE_colorSet: UNSAFE_colorSet,
    buttonSize: buttonSize,
    fallbackSet: fallbackSet,
    status: status
  }, /*#__PURE__*/React.createElement(ButtonChildren, {
    iconOnly: iconOnly,
    iconLeading: iconLeading,
    iconTrailing: iconTrailing,
    buttonSize: buttonSize,
    children: children
  })), !useBrowserDefaultFocusStyle && /*#__PURE__*/React.createElement(ButtonFocus, {
    isUsingKeyboard: isUsingKeyboard
  }));
});
/**
 * TODO: Remove when we deprecate `buttonSize` helpers like `ButtonPrimary.sm`.
 */

var buttonHelpers = _objectSpread(_objectSpread({}, buttonSizes), {}, {
  displayName: 'ButtonPrimary'
});
/**
* **ButtonPrimary** ![Status: Production](https://img.shields.io/badge/PRODUCTION-%2357B560|height=14)
*
* [GitHub](https://ghe.spotify.net/encore/web/tree/master/src/core/components/ButtonPrimary) | [Storybook](https://encore-web.spotify.net/?path=/docs/components-button-buttonprimary--default) | [Encore](https://encore.spotify.net/web/components/button#buttonprimary) | [Figma](https://www.figma.com/file/bnQXqGkLeiTlbk8JXGDcsX/Encore-Web---Light-Theme-Toolkit?node-id=0:214) |
*
* Primary buttons are for the action with the highest priority. They have filled backgrounds and use the bright accent color set by default.
*
* @example
* () => <ButtonPrimary>Default</ButtonPrimary>;
*
*/


export var ButtonPrimary = Object.assign(ButtonComponent, buttonHelpers);
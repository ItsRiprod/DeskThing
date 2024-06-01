import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
var _excluded = ["component", "buttonSize", "iconLeading", "iconTrailing", "iconOnly", "children", "aria-label", "aria-labelledby"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

import React, { useContext } from 'react';
import { BrowserDefaultFocusStyleContext } from "../../contexts/BrowserDefaultFocusStyleContext";
import { EncoreContext, encoreContextKeyword, getStatus } from "../../contexts/EncoreContext";
import { KeyboardDetectionContext } from "../../contexts/KeyboardDetectionContext";
import { buttonSizes } from "../../styles";
import { Button } from "./Button";
import { ButtonChildren } from "./ButtonChildren";
var ButtonComponent = /*#__PURE__*/React.forwardRef(function ButtonComponent(_ref, ref) {
  var component = _ref.component,
      _ref$buttonSize = _ref.buttonSize,
      buttonSize = _ref$buttonSize === void 0 ? 'md' : _ref$buttonSize,
      iconLeading = _ref.iconLeading,
      iconTrailing = _ref.iconTrailing,
      iconOnly = _ref.iconOnly,
      children = _ref.children,
      ariaLabel = _ref['aria-label'],
      ariaLabelledby = _ref['aria-labelledby'],
      props = _objectWithoutProperties(_ref, _excluded);

  if (iconOnly && !ariaLabel && !ariaLabelledby) {
    // eslint-disable-next-line no-console
    console.warn('ButtonSecondary must have an aria-label or aria-labelledby attribute defined when using the iconOnly prop in order to be accessible.');
  }

  var _useContext = useContext(KeyboardDetectionContext),
      isUsingKeyboard = _useContext.isUsingKeyboard;

  var _useContext2 = useContext(BrowserDefaultFocusStyleContext),
      useBrowserDefaultFocusStyle = _useContext2.useBrowserDefaultFocusStyle;

  var config = useContext(EncoreContext);
  var status = getStatus(encoreContextKeyword.button, config);
  var rel = props.href && props.target === '_blank' ? 'noopener noreferrer' : null;
  return /*#__PURE__*/React.createElement(Button, Object.assign({}, props, {
    rel: rel,
    ref: ref,
    component: !component && props.href ? 'a' : component,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    isUsingKeyboard: isUsingKeyboard,
    useBrowserDefaultFocusStyle: useBrowserDefaultFocusStyle,
    buttonSize: buttonSize,
    iconOnly: iconOnly,
    iconLeading: iconLeading,
    iconTrailing: iconTrailing,
    status: status
  }), /*#__PURE__*/React.createElement(ButtonChildren, {
    iconOnly: iconOnly,
    iconLeading: iconLeading,
    iconTrailing: iconTrailing,
    buttonSize: buttonSize,
    children: children
  }));
});
/**
 * TODO: Remove when we deprecate `buttonSize` helpers like `ButtonSecondary.sm`.
 */

var buttonHelpers = _objectSpread(_objectSpread({}, buttonSizes), {}, {
  displayName: 'ButtonSecondary'
});
/**
* **ButtonSecondary** ![Status: Production](https://img.shields.io/badge/PRODUCTION-%2357B560|height=14)
*
* [GitHub](https://ghe.spotify.net/encore/web/tree/master/src/core/components/ButtonSecondary) | [Storybook](https://encore-web.spotify.net/?path=/docs/components-button-buttonsecondary--default) | [Encore](https://encore.spotify.net/web/components/button?format=figma-figma#buttonsecondary) | [Figma](https://www.figma.com/file/bnQXqGkLeiTlbk8JXGDcsX/Encore-Web---Light-Theme-Toolkit?node-id=7643:5628) |
*
* Secondary buttons have a stroke and no fill and indicate an alternate or less important action.
*
* @example
* () => <ButtonSecondary>Default</ButtonSecondary>;
*
*/


export var ButtonSecondary = Object.assign(ButtonComponent, buttonHelpers);
export default ButtonSecondary;
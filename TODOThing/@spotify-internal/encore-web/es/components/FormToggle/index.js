import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
var _excluded = ["small", "children", "semanticColor", "isFocus", "isActive"];
import React, { useContext } from 'react';
import { KeyboardDetectionContext } from "../../contexts/KeyboardDetectionContext";
import { VisuallyHidden } from "../VisuallyHidden";
import { Checkbox } from "./Checkbox";
import { Indicator } from "./Indicator";
import { Label } from "./Label";
import { Wrapper } from "./Wrapper";
export var FormToggle = /*#__PURE__*/React.forwardRef(function FormToggle(_ref, ref) {
  var small = _ref.small,
      children = _ref.children,
      _ref$semanticColor = _ref.semanticColor,
      semanticColor = _ref$semanticColor === void 0 ? 'essentialBrightAccent' : _ref$semanticColor,
      isFocus = _ref.isFocus,
      isActive = _ref.isActive,
      props = _objectWithoutProperties(_ref, _excluded);

  var _useContext = useContext(KeyboardDetectionContext),
      isUsingKeyboard = _useContext.isUsingKeyboard;

  return /*#__PURE__*/React.createElement(Checkbox, null, /*#__PURE__*/React.createElement(VisuallyHidden, Object.assign({
    component: "input",
    type: "checkbox",
    ref: ref
  }, props)), /*#__PURE__*/React.createElement(Wrapper, {
    isUsingKeyboard: isUsingKeyboard,
    semanticColor: semanticColor,
    isFocus: isFocus,
    isActive: isActive
  }, /*#__PURE__*/React.createElement(Indicator, null)), children && /*#__PURE__*/React.createElement(Label, {
    small: small
  }, children));
});
/**
* **FormToggle** ![Status: Production](https://img.shields.io/badge/PRODUCTION-%2357B560|height=14)
*
* [GitHub](https://ghe.spotify.net/encore/web/tree/master/src/core/components/FormToggle) | [Storybook](https://encore-web.spotify.net/?path=/docs/components-form-formtoggle--default) | [Encore](https://encore.spotify.net/web/components/selectors?format=figma-figma#formtoggle) | [Figma](https://www.figma.com/file/bnQXqGkLeiTlbk8JXGDcsX/Encore-Web---Light-Theme-Toolkit?node-id=0:620) |
*
* FormToggle allow users to switch the state of a single item on or off, within a Form component.
*
* @example
* () => (
*  <FormGroup label="FormToggle example" withFieldset>
*    <FormToggle defaultChecked>Option 1</FormToggle>
*    <FormToggle>Option 2</FormToggle>
*  </FormGroup>
*);
*
*/
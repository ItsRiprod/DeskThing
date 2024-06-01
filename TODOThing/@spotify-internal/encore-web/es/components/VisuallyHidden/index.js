import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
var _excluded = ["component"];
import React from 'react';
import styled from 'styled-components';
import { visuallyHidden } from "../../styles";
var VisuallyHiddenElement = styled( /*#__PURE__*/React.forwardRef(function VisuallyHiddenElement(_ref, ref) {
  var _ref$component = _ref.component,
      Component = _ref$component === void 0 ? 'span' : _ref$component,
      props = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/React.createElement(Component, Object.assign({}, props, {
    ref: ref
  }));
})).withConfig({
  displayName: "VisuallyHidden__VisuallyHiddenElement",
  componentId: "sc-17bibe8-0"
})(["", ""], visuallyHidden());
export var VisuallyHidden = /*#__PURE__*/React.forwardRef(function VisuallyHidden(props, ref) {
  return /*#__PURE__*/React.createElement(VisuallyHiddenElement, Object.assign({}, props, {
    ref: ref
  }));
});
/**
* **VisuallyHidden** ![Status: Production](https://img.shields.io/badge/PRODUCTION-%2357B560|height=14)
*
* [GitHub](https://ghe.spotify.net/encore/web/tree/master/src/core/components/VisuallyHidden) | [Storybook](https://encore-web.spotify.net/?path=/docs/components-visuallyhidden--default) | [Encore](https://encore.spotify.net/web/components/non-visual?format=figma-figma#visuallyhidden) | 
*
* null
*
* @example
* () => <VisuallyHidden>Visually hidden span.</VisuallyHidden>;
*
*/
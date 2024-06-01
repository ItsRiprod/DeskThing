import React from 'react';
import { IconWrapper } from "./IconWrapper";
export var ButtonChildren = function ButtonChildren(_ref) {
  var iconOnly = _ref.iconOnly,
      iconLeading = _ref.iconLeading,
      iconTrailing = _ref.iconTrailing,
      children = _ref.children,
      buttonSize = _ref.buttonSize;

  var renderIcon = function renderIcon(position, icon) {
    return icon && /*#__PURE__*/React.createElement(IconWrapper, {
      icon: icon,
      position: position,
      buttonSize: buttonSize
    });
  };

  return iconOnly ? /*#__PURE__*/React.createElement(React.Fragment, null, renderIcon('only', iconOnly)) : /*#__PURE__*/React.createElement(React.Fragment, null, renderIcon('leading', iconLeading), children, renderIcon('trailing', iconTrailing));
};
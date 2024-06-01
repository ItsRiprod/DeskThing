import React from 'react';
import styled, { css } from 'styled-components';
import { buttonHeightMinimum, buttonIconSize, buttonWithIconSidePadding } from "../../styles";
import { pxToInt } from "../../typeHelpers";
import { borderWidth } from "./Button";
var Wrapper = styled.span.withConfig({
  displayName: "IconWrapper__Wrapper",
  componentId: "ihacte-0"
})(["", ""], function (_ref) {
  var buttonSize = _ref.buttonSize,
      iconSize = _ref.iconSize,
      position = _ref.position;
  var iconLeadingTrailingPosition = buttonWithIconSidePadding[buttonSize];
  var iconOnlyPosition = (pxToInt(buttonHeightMinimum[buttonSize]) - pxToInt(iconSize)) / 2 - borderWidth;
  return css(["display:flex;position:absolute;", " ", " ", ""], position === 'only' && css(["top:", "px;left:", "px;[dir='rtl'] &{right:", "px;left:auto;}"], iconOnlyPosition, iconOnlyPosition, iconOnlyPosition), position === 'leading' && css(["left:", ";[dir='rtl'] &{right:", ";left:auto;}"], iconLeadingTrailingPosition, iconLeadingTrailingPosition), position === 'trailing' && css(["right:", ";[dir='rtl'] &{left:", ";right:auto;}"], iconLeadingTrailingPosition, iconLeadingTrailingPosition));
});
export var IconWrapper = function IconWrapper(_ref2) {
  var position = _ref2.position,
      buttonSize = _ref2.buttonSize,
      icon = _ref2.icon;
  var Icon = icon;
  /** Override standard icon size for lg iconOnly buttons */

  var iconSize = position === 'only' && buttonSize === 'lg' ? '28px' : buttonIconSize[buttonSize];
  return /*#__PURE__*/React.createElement(Wrapper, {
    position: position,
    buttonSize: buttonSize,
    iconSize: iconSize,
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Icon, {
    iconSize: pxToInt(iconSize)
  }));
};
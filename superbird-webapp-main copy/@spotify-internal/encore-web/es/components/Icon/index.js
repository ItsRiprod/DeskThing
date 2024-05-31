import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
var _excluded = ["iconSize", "semanticColor", "color", "title", "titleId", "desc", "descId", "autoMirror"];
import React from 'react';
import Svg from "./Svg";
// return the highest possible size that is <= the requested size,
// we sort asc to return the smallest size if requested value < smallest size
export var findClosestGlyphAvailable = function findClosestGlyphAvailable(glyphList, val) {
  return glyphList.sort(function (a, b) {
    return a.size - b.size;
  }).reduce(function (prev, current) {
    if (current.size <= val && current.size > prev.size) {
      return current;
    }

    return prev;
  });
};
export var Icon = function Icon(_ref) {
  var _ref$iconSize = _ref.iconSize,
      iconSize = _ref$iconSize === void 0 ? 24 : _ref$iconSize,
      semanticColor = _ref.semanticColor,
      color = _ref.color,
      title = _ref.title,
      titleId = _ref.titleId,
      desc = _ref.desc,
      descId = _ref.descId,
      autoMirror = _ref.autoMirror,
      props = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/React.createElement(Svg, Object.assign({
    role: "img",
    height: iconSize,
    width: iconSize,
    iconSize: iconSize,
    iconColor: semanticColor,
    autoMirror: autoMirror
  }, props));
};
/**
* **Icon** ![Status: Production](https://img.shields.io/badge/PRODUCTION-%2357B560|height=14)
*
* [GitHub](https://ghe.spotify.net/encore/web/tree/master/src/core/components/Icon) | [Storybook](https://encore-web.spotify.net/?path=/docs/components-icon--default) | [Encore](https://encore.spotify.net/web/components/icon) | [Figma](https://www.figma.com/file/bnQXqGkLeiTlbk8JXGDcsX/Encore-Web---Light-Theme-Toolkit?node-id=190:0) |
*
* Renders a responsive system of SVG icons based on a 24px size. Default and experimental icon sets are available.
*
* @example
* () => <IconHeadphones aria-label="IconHeadphones" />;
*
*/

export default Icon;
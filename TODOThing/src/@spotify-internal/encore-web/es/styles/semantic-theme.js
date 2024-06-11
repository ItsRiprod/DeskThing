import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

import { lightTheme } from '../../../encore-foundation';
import getColor from 'color';
/**
 * Theme default constants for Encore Web
 * */

export var defaultTheme = lightTheme;
export var defaultColorSetName = 'base';
export var defaultColorSet = defaultTheme[defaultColorSetName];
export var colorSets = Object.keys(defaultTheme);

var capitalize = function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
/**
 * Takes a deeply nested object and returns a flattend map of all the values
 * with the keys camelCased.
 * @param obj - a nested object of string values
 * @param string - the parent key of an object used for recursion.
 * @returns an object with camcelCased keys and string values
 */


export var getFlatCamelCaseMap = function getFlatCamelCaseMap(obj) {
  var previousKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  return Object.entries(obj).reduce(function (prevObj, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    var camelKey = key;

    if (previousKey !== '') {
      camelKey = "".concat(previousKey).concat(capitalize(key));
    }

    if (typeof value === 'object') {
      return _objectSpread(_objectSpread({}, prevObj), getFlatCamelCaseMap(value, camelKey));
    } else if (typeof value === 'string') {
      prevObj[camelKey] = value;
      return prevObj;
    }

    return prevObj;
  }, {});
};

function camelToKebab(inputString) {
  return inputString.replace(/[A-Z0-9]/g, function (m) {
    return "-".concat(m.toLowerCase());
  });
}

export function makeColorSetClass(colorSet) {
  return colorSet ? "encore-".concat(camelToKebab(colorSet), "-set") : '';
}
export function makeCampaignCategoryColorSetClass(colorSet) {
  if (!colorSet) return '';
  var removedSetKeyword = colorSet.replace('Set', '');
  return "encore-".concat(camelToKebab(removedSetKeyword), "-set");
}

/**
 * Appends colorSet classname to the passed className string
 * @param colorSet - A colorSet (eg. 'base', 'negative', 'brightAccent')
 * @param className - Other classnames passed from the elements
 * @returns string of passed classnames plus the colorset class
 */
export function addColorSet(colorSet, className) {
  if (colorSet in lightTheme) {
    return [makeColorSetClass(colorSet), className].join(' ').trim();
  }

  return [makeCampaignCategoryColorSetClass(colorSet), className].join(' ').trim();
}
/**
 * Returns the css variable format of a semanticColor
 * @param semanticColor - a semanticColor (eg 'textBase,' 'decorativeSubdued')
 * @returns a css variable in kebabcase format with a '--' prefix
 */

export function cssColorVar(semanticColor) {
  return "--".concat(camelToKebab(semanticColor));
}
export function cssColorSet(colorSetObject) {
  return Object.entries(getFlatCamelCaseMap(colorSetObject)).map(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        token = _ref4[0],
        hex = _ref4[1];

    return "\n      ".concat(cssColorVar(token), ": ").concat(hex, " !important;\n    ");
  });
}
/**
 * Get a CSS value that can be used when authoring CSS color rules
 * @param semanticColor - a semanticColor (eg 'textBase,' 'decorativeSubdued')
 * @param [fallbackColor] - a valid CSS <color> value as fallback
 * @returns a string in the form of `var(--semantic-color-variable, <fallback>)`
 */

export function cssColorValue(semanticColor, fallbackColor) {
  var flattenedDefaultColorSet = getFlatCamelCaseMap(defaultColorSet);
  var fallback = flattenedDefaultColorSet[semanticColor];

  if (fallbackColor) {
    fallback = fallbackColor;
  }

  return "var(".concat(cssColorVar(semanticColor), ", ").concat(fallback, ")");
}
export var semanticBackgroundColors = {
  backgroundBase: 'backgroundBase',
  backgroundHighlight: 'backgroundHighlight',
  backgroundPress: 'backgroundPress',
  backgroundElevatedBase: 'backgroundElevatedBase',
  backgroundElevatedHighlight: 'backgroundElevatedHighlight',
  backgroundElevatedPress: 'backgroundElevatedPress',
  backgroundTintedBase: 'backgroundTintedBase',
  backgroundTintedHighlight: 'backgroundTintedHighlight',
  backgroundTintedPress: 'backgroundTintedPress',
  backgroundUnsafeForSmallTextBase: 'backgroundUnsafeForSmallTextBase',
  backgroundUnsafeForSmallTextHighlight: 'backgroundUnsafeForSmallTextHighlight',
  backgroundUnsafeForSmallTextPress: 'backgroundUnsafeForSmallTextPress'
};
export var semanticTextColors = {
  textBase: 'textBase',
  textSubdued: 'textSubdued',
  textBrightAccent: 'textBrightAccent',
  textNegative: 'textNegative',
  textWarning: 'textWarning',
  textPositive: 'textPositive',
  textAnnouncement: 'textAnnouncement'
};
export var semanticEssentialColors = {
  essentialBase: 'essentialBase',
  essentialSubdued: 'essentialSubdued',
  essentialBrightAccent: 'essentialBrightAccent',
  essentialNegative: 'essentialNegative',
  essentialWarning: 'essentialWarning',
  essentialPositive: 'essentialPositive',
  essentialAnnouncement: 'essentialAnnouncement'
};
export var semanticDecorativeColors = {
  decorativeBase: 'decorativeBase',
  decorativeSubdued: 'decorativeSubdued'
};
export var semanticColors = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, semanticBackgroundColors), semanticTextColors), semanticEssentialColors), semanticDecorativeColors); // TODO export this from foundation?
// https://ghe.spotify.net/encore/foundation/blob/master/src/extensions/theme/color-tune/predicates.ts

export var calcAccessibleContrast = function calcAccessibleContrast(color1, color2) {
  return color1.contrast(color2);
}; // TODO export this from foundation?
// https://ghe.spotify.net/encore/foundation/blob/master/src/extensions/theme/utils.js#L8

var getHighContrastColor = function getHighContrastColor(color) {
  var white = getColor('#FFFFFF');
  var black = getColor('#000000');
  var contrastWhite = calcAccessibleContrast(color, white);
  var contrastBlack = calcAccessibleContrast(color, black);
  return contrastWhite >= contrastBlack ? white : black;
};
/**
 * Create a simple color set from a custom color, that meets contrast requirements
 * @param backgroundValue
 * @param [suggestedForegroundValue]
 */


export var createBasicColorSet = function createBasicColorSet(backgroundValue, suggestedForegroundValue) {
  var adjustment = 5;
  var accessibleContrast = 4.45;
  var background = getColor(backgroundValue);
  var suggestedForeground = undefined;

  if (suggestedForegroundValue) {
    suggestedForeground = getColor(suggestedForegroundValue);
  }

  var foreground = suggestedForeground && calcAccessibleContrast(background, suggestedForeground) >= accessibleContrast ? suggestedForeground : getHighContrastColor(background);
  var foregroundIsLighter = foreground.luminosity() >= background.luminosity();
  var backgroundHighlight = foregroundIsLighter ? getColor(background.lightness(background.hsl().object().l - adjustment)) : getColor(background.lightness(background.hsl().object().l + adjustment));
  var backgroundPress = foregroundIsLighter ? getColor(backgroundHighlight.lightness(backgroundHighlight.hsl().object().l - adjustment)) : getColor(backgroundHighlight.lightness(backgroundHighlight.hsl().object().l + adjustment));
  return {
    background: {
      base: background.hex(),
      highlight: backgroundHighlight.hex(),
      press: backgroundPress.hex(),
      elevated: {
        base: background.hex(),
        highlight: backgroundHighlight.hex(),
        press: backgroundPress.hex()
      },
      tinted: {
        base: background.hex(),
        highlight: backgroundHighlight.hex(),
        press: backgroundPress.hex()
      },
      unsafeForSmallText: {
        base: background.hex(),
        highlight: backgroundHighlight.hex(),
        press: backgroundPress.hex()
      }
    },
    text: {
      base: foreground.hex(),
      subdued: foreground.hex(),
      brightAccent: foreground.hex(),
      negative: foreground.hex(),
      warning: foreground.hex(),
      positive: foreground.hex(),
      announcement: foreground.hex()
    },
    essential: {
      base: foreground.hex(),
      subdued: foreground.hex(),
      brightAccent: foreground.hex(),
      negative: foreground.hex(),
      warning: foreground.hex(),
      positive: foreground.hex(),
      announcement: foreground.hex()
    },
    decorative: {
      base: foreground.hex(),
      subdued: foreground.hex()
    }
  };
};
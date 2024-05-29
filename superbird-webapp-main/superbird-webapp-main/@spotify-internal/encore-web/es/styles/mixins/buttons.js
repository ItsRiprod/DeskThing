import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

var _buttonHeightMinimum, _deprecatedButtonPadd, _defaultButtonPadding, _defaultButtonPadding2, _buttonWithIconSidePa, _buttonWithIconMargin, _buttonIconSize;

//
// Buttons
// --------------------------------------------------
import { spacer4, spacer8, spacer12, spacer16, spacer20, spacer24, spacer32, spacer48, spacer56 } from '@spotify-internal/encore-foundation';
import { css } from 'styled-components';
import { encoreContextStatus } from "../../contexts/EncoreContext";
import { balladBold, browserFocusReset, cello, cursorDisabled, finaleBold, mestoBold, opacityActive, opacityDisabled, rootStyle, violaBold } from "../../styles";
import { pxToInt } from "../../typeHelpers";
export var buttonSizes = {
  /**
   * @deprecated
   * Use buttonSize="sm" instead.
   */
  sm: 'sm',

  /**
   * @deprecated
   * Use buttonSize="md" instead.
   */
  md: 'md',

  /**
   * @deprecated
   * Use buttonSize="lg" instead.
   */
  lg: 'lg'
};

/** Height of single-line buttons */
export var buttonHeightMinimum = (_buttonHeightMinimum = {}, _defineProperty(_buttonHeightMinimum, buttonSizes.sm, spacer32), _defineProperty(_buttonHeightMinimum, buttonSizes.md, spacer48), _defineProperty(_buttonHeightMinimum, buttonSizes.lg, spacer56), _buttonHeightMinimum);
export var buttonBorderRadius = '500px';
export var buttonTransitionFade = '33ms';
export var buttonTextTransform = 'none';
export var buttonHoverScale = '1.04';
export var deprecatedButtonPaddingTopBottom = (_deprecatedButtonPadd = {}, _defineProperty(_deprecatedButtonPadd, buttonSizes.sm, spacer8), _defineProperty(_deprecatedButtonPadd, buttonSizes.md, '14px'), _defineProperty(_deprecatedButtonPadd, buttonSizes.lg, spacer16), _deprecatedButtonPadd);
export var defaultButtonPaddingTopBottom = (_defaultButtonPadding = {}, _defineProperty(_defaultButtonPadding, buttonSizes.sm, spacer4), _defineProperty(_defaultButtonPadding, buttonSizes.md, spacer8), _defineProperty(_defaultButtonPadding, buttonSizes.lg, spacer12), _defaultButtonPadding);
/**
 * Left and right padding for buttons without icons.
 * For buttons with `iconLeading` or `iconTrailing`, see `getButtonWithIconLeftRightPadding()`.
 */

export var defaultButtonPaddingLeftRight = (_defaultButtonPadding2 = {}, _defineProperty(_defaultButtonPadding2, buttonSizes.sm, spacer16), _defineProperty(_defaultButtonPadding2, buttonSizes.md, spacer32), _defineProperty(_defaultButtonPadding2, buttonSizes.lg, spacer48), _defaultButtonPadding2);
/**
 * Observed left &/or right padding for buttons with `iconLeading` or `iconTrailing`.
 * Note: "Observed" because the true padding is calculated, see `getButtonWithIconLeftRightPadding()`.
 */

export var buttonWithIconSidePadding = (_buttonWithIconSidePa = {}, _defineProperty(_buttonWithIconSidePa, buttonSizes.sm, spacer12), _defineProperty(_buttonWithIconSidePa, buttonSizes.md, spacer20), _defineProperty(_buttonWithIconSidePa, buttonSizes.lg, spacer24), _buttonWithIconSidePa);
/** Observed margin between icons and text (absolute positioned, not real margin) */

export var buttonWithIconMargin = (_buttonWithIconMargin = {}, _defineProperty(_buttonWithIconMargin, buttonSizes.sm, '5px'), _defineProperty(_buttonWithIconMargin, buttonSizes.md, spacer12), _defineProperty(_buttonWithIconMargin, buttonSizes.lg, '10px'), _buttonWithIconMargin);
/**
 * Standard icon size to use with each button size.
 * Note: These standard sizes aren't always used. See `getButtonIconSize()`.
 * */

export var buttonIconSize = (_buttonIconSize = {}, _defineProperty(_buttonIconSize, buttonSizes.sm, spacer16), _defineProperty(_buttonIconSize, buttonSizes.md, spacer24), _defineProperty(_buttonIconSize, buttonSizes.lg, spacer24), _buttonIconSize);
export var defaultTypeVariants = {
  sm: 'mestoBold',
  md: 'balladBold',
  lg: 'cello'
};
export var deprecatedTypeVariants = {
  sm: 'finaleBold',
  md: 'violaBold',
  lg: 'balladBold'
};

var getDeprecatedButtonFont = function getDeprecatedButtonFont(buttonSize) {
  switch (buttonSize) {
    case buttonSizes.sm:
      return finaleBold();

    case buttonSizes.md:
      return violaBold();

    case buttonSizes.lg:
      return balladBold();

    default:
      return violaBold();
  }
};

export var getButtonFont = function getButtonFont(buttonSize, status) {
  if (status === encoreContextStatus.deprecated) {
    return getDeprecatedButtonFont(buttonSize);
  }

  switch (buttonSize) {
    case buttonSizes.sm:
      return mestoBold();

    case buttonSizes.md:
      return balladBold();

    case buttonSizes.lg:
      return cello();

    default:
      return balladBold();
  }
};
/**
 * Calculates side padding for buttons with `iconLeading` &/or `iconTrailing`.
 * Accounts for the icon's size, padding on the button edge, and margin between icons and text.
 * Used in ButtonPrimary and ButtonSecondary.
 */

var getButtonWithIconLeftRightPadding = function getButtonWithIconLeftRightPadding(buttonSize) {
  var padding = buttonWithIconSidePadding[buttonSize];
  var margin = buttonWithIconMargin[buttonSize];
  var iconSize = buttonIconSize[buttonSize];
  return pxToInt(padding) + pxToInt(iconSize) + pxToInt(margin);
};

export var getButtonPaddingValues = function getButtonPaddingValues(buttonSize) {
  var borderWidth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var status = arguments.length > 2 ? arguments[2] : undefined;
  var paddingTopBottom;

  if (status === 'deprecated') {
    paddingTopBottom = "".concat(pxToInt(deprecatedButtonPaddingTopBottom[buttonSize]) - borderWidth, "px");
  } else {
    paddingTopBottom = "".concat(pxToInt(defaultButtonPaddingTopBottom[buttonSize]) - borderWidth, "px");
  }

  var paddingLeftRight = "".concat(pxToInt(defaultButtonPaddingLeftRight[buttonSize]) - borderWidth, "px");
  var withIconPaddingLeftRight = "".concat(getButtonWithIconLeftRightPadding(buttonSize) - borderWidth, "px");
  return {
    paddingTopBottom: paddingTopBottom,
    paddingLeftRight: paddingLeftRight,
    withIconPaddingLeftRight: withIconPaddingLeftRight
  };
};
export var getButtonPadding = function getButtonPadding(buttonSize, iconLeading, iconTrailing, iconOnly, borderWidth, status) {
  var _getButtonPaddingValu = getButtonPaddingValues(buttonSize, borderWidth, status),
      paddingTopBottom = _getButtonPaddingValu.paddingTopBottom,
      paddingLeftRight = _getButtonPaddingValu.paddingLeftRight,
      withIconPaddingLeftRight = _getButtonPaddingValu.withIconPaddingLeftRight;
  /** iconOnly buttons used fixed width & height instead of padding */


  var iconOnlyDimensions = css(["inline-size:", ";block-size:", ";"], buttonHeightMinimum[buttonSize], buttonHeightMinimum[buttonSize]);
  var noIconPadding = css(["padding-block-start:", ";padding-block-end:", ";padding-inline-start:", ";padding-inline-end:", ";"], paddingTopBottom, paddingTopBottom, paddingLeftRight, paddingLeftRight);
  var symmetricalIconPadding = css(["padding-block-start:", ";padding-block-end:", ";padding-inline-start:", ";padding-inline-end:", ";"], paddingTopBottom, paddingTopBottom, withIconPaddingLeftRight, withIconPaddingLeftRight);
  var asymmetricalIconPadding = css(["padding-block-start:", ";padding-block-end:", ";padding-inline-start:", ";padding-inline-end:", ";"], paddingTopBottom, paddingTopBottom, iconLeading ? withIconPaddingLeftRight : paddingLeftRight, iconTrailing ? withIconPaddingLeftRight : paddingLeftRight);

  if (iconOnly) {
    return iconOnlyDimensions;
  }

  if (!iconLeading && !iconTrailing) {
    return noIconPadding;
  }

  if (iconLeading && iconTrailing) {
    return symmetricalIconPadding;
  }

  return asymmetricalIconPadding;
};
/** Base styles shared by most buttons, including root style, focus reset and font sizes */

export var buttonStylesBase = function buttonStylesBase(buttonSize, useBrowserDefaultFocusStyle, status) {
  return css(["", ";", " ", ";background-color:transparent;border:0;border-radius:", ";display:inline-block;position:relative;text-align:center;text-decoration:none;text-transform:", ";touch-action:manipulation;transition-duration:", ";transition-property:background-color,border-color,color,box-shadow,filter,transform;user-select:none;vertical-align:middle;transform:translate3d(0,0,0);"], rootStyle(), !useBrowserDefaultFocusStyle && browserFocusReset, getButtonFont(buttonSize, status), buttonBorderRadius, buttonTextTransform, buttonTransitionFade);
};
/** Disabled styles shared by most buttons */

export var buttonStylesDisabled = css(["cursor:", ";opacity:", ";transform:scale(1);"], cursorDisabled, opacityDisabled);
/** Active styles shares by most buttons */

export var buttonStylesActive = css(["opacity:", ";outline:none;transform:scale(1);"], opacityActive);
/** Hover styles shares by most buttons */

export var buttonStylesHover = css(["transform:scale(", ");"], buttonHoverScale); // Reset a button to a link looking thing

export var buttonLinkReset = function buttonLinkReset() {
  var useBrowserDefaultFocusStyle = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  return css(["background-color:transparent;border:0;color:inherit;line-height:1;letter-spacing:inherit;padding:0;", ""], !useBrowserDefaultFocusStyle && browserFocusReset);
};
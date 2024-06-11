import { breakpoint, desktopAlto, desktopAltoBrio, desktopBallad, desktopBalladBold, desktopBass, desktopBrio, desktopCanon, desktopCello, desktopCelloCanon, desktopFinale, desktopFinaleBold, desktopForte, desktopMesto, desktopMestoBold, desktopMetronome, desktopMinuet, desktopMinuetBold, desktopViola, desktopViolaBold, mobileAlto, mobileAltoBrio, mobileBallad, mobileBalladBold, mobileBass, mobileBrio, mobileCanon, mobileCello, mobileCelloCanon, mobileFinale, mobileFinaleBold, mobileForte, mobileMesto, mobileMestoBold, mobileMetronome, mobileMinuet, mobileMinuetBold, mobileViola, mobileViolaBold } from '../../../../encore-foundation';
import { css } from 'styled-components';

var responsiveVariant = function responsiveVariant(mobileToken, desktopToken) {
  var isSizeDifferent = mobileToken.fontSize !== desktopToken.fontSize;
  var isWeightDifferent = mobileToken.fontWeight !== desktopToken.fontWeight;
  var isTransformDifferent = mobileToken.textTransform !== desktopToken.textTransform;
  var isLetterSpacingDifferent = mobileToken.letterSpacing !== desktopToken.letterSpacing;
  var isFamilyDifferent = mobileToken.fontFamily !== desktopToken.fontFamily;
  var isDesktopDifferent = isSizeDifferent || isWeightDifferent || isFamilyDifferent || isTransformDifferent || isLetterSpacingDifferent;
  return css(["font-size:", ";font-weight:", ";text-transform:", ";letter-spacing:", ";font-family:var(--font-family,", ");", ";"], mobileToken.fontSize, mobileToken.fontWeight, mobileToken.textTransform, mobileToken.letterSpacing, mobileToken.fontFamily,
  /* only apply desktop styles if they differ from mobile ones */
  isDesktopDifferent && css(["@media (min-width:", "){font-size:", ";font-weight:", ";font-family:", ";text-transform:", ";letter-spacing:", ";}"], breakpoint.screenSmMin, isSizeDifferent && desktopToken.fontSize, isWeightDifferent && desktopToken.fontWeight, isFamilyDifferent && "var(--font-family, ".concat(desktopToken.fontFamily, ")"), isTransformDifferent && desktopToken.textTransform, isLetterSpacingDifferent && desktopToken.letterSpacing));
};

export var bass = function bass() {
  return responsiveVariant(mobileBass, desktopBass);
};
export var forte = function forte() {
  return responsiveVariant(mobileForte, desktopForte);
};
export var brio = function brio() {
  return responsiveVariant(mobileBrio, desktopBrio);
};
export var alto = function alto() {
  return responsiveVariant(mobileAlto, desktopAlto);
};
export var altoBrio = function altoBrio() {
  return responsiveVariant(mobileAltoBrio, desktopAltoBrio);
};
export var canon = function canon() {
  return responsiveVariant(mobileCanon, desktopCanon);
};
export var cello = function cello() {
  return responsiveVariant(mobileCello, desktopCello);
};
export var celloCanon = function celloCanon() {
  return responsiveVariant(mobileCelloCanon, desktopCelloCanon);
};
export var ballad = function ballad() {
  return responsiveVariant(mobileBallad, desktopBallad);
};
export var balladBold = function balladBold() {
  return responsiveVariant(mobileBalladBold, desktopBalladBold);
};
export var viola = function viola() {
  return responsiveVariant(mobileViola, desktopViola);
};
export var violaBold = function violaBold() {
  return responsiveVariant(mobileViolaBold, desktopViolaBold);
};
export var mesto = function mesto() {
  return responsiveVariant(mobileMesto, desktopMesto);
};
export var mestoBold = function mestoBold() {
  return responsiveVariant(mobileMestoBold, desktopMestoBold);
};
export var metronome = function metronome() {
  return responsiveVariant(mobileMetronome, desktopMetronome);
};
export var finale = function finale() {
  return responsiveVariant(mobileFinale, desktopFinale);
};
export var finaleBold = function finaleBold() {
  return responsiveVariant(mobileFinaleBold, desktopFinaleBold);
};
export var minuet = function minuet() {
  return responsiveVariant(mobileMinuet, desktopMinuet);
};
export var minuetBold = function minuetBold() {
  return responsiveVariant(mobileMinuetBold, desktopMinuetBold);
};
// shim for sass constants

import variables from './variables.module.scss';

export const transitionDurationMs = parseInt(
  variables['transition-duration-ms'],
  10,
);
export const easingFunction = variables['easing-function'];
export const genericEasing = variables['generic-cubic'];
export const recedeDefaultEasing = variables['recede-default-cubic'];
export const greenLight = variables['green-light'];

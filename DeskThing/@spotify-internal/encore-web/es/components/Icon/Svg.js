import styled, { css } from 'styled-components';
export default styled.svg.withConfig({
  displayName: "Svg",
  componentId: "ytk21e-0"
})(["*{vector-effect:non-scaling-stroke;}", " ", ""], function (props) {
  return props.autoMirror && css(["[dir='rtl'] &&{transform:scaleX(-1);}"]);
}, function (props) {
  return props.iconColor ? css(["fill:currentColor;"]) : css(["fill:currentColor;"]);
});
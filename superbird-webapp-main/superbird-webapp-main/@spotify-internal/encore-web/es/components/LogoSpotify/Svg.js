import { greenLight } from '@spotify-internal/encore-foundation';
import styled from 'styled-components';
import { cssColorValue } from "../../styles";
export var Svg = styled.svg.withConfig({
  displayName: "Svg",
  componentId: "sc-6c3c1v-0"
})(["fill:", ";stroke:transparent;"], function (props) {
  return props.useBrandColor ? greenLight : cssColorValue(props.semanticColor);
});
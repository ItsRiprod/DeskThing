import { spacer12 } from '@spotify-internal/encore-foundation';
import styled from 'styled-components';
import { cssColorValue, semanticColors } from "../../styles";
export var Indicator = styled.span.withConfig({
  displayName: "Indicator",
  componentId: "acu4qz-0"
})(["background:", ";border-radius:inherit;block-size:", ";position:absolute;top:2px;inline-size:", ";transition:all 0.1s ease;"], cssColorValue(semanticColors.backgroundBase), spacer12, spacer12);
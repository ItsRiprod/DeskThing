import { css } from 'styled-components';
export var visuallyHidden = function visuallyHidden() {
  return css(["border:0;clip:rect(0,0,0,0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;"]);
};
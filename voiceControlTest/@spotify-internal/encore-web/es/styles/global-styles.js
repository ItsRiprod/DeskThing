import _taggedTemplateLiteral from "@babel/runtime/helpers/esm/taggedTemplateLiteral";

var _templateObject;

//
// Global styles: Optional styles to reset CSS for an application
// --------------------------------------------------------------
import { desktopBallad } from '@spotify-internal/encore-foundation';
import { createGlobalStyle } from 'styled-components';
export default createGlobalStyle(_templateObject || (_templateObject = _taggedTemplateLiteral(["\n  /*\n    Reset the box-sizing\n\n    Heads up! This reset may cause conflicts with some third-party widgets.\n    For recommendations on resolving such conflicts, see\n    http://getbootstrap.com/getting-started/#third-box-sizing\n  */\n\n  * {\n    box-sizing: border-box;\n  }\n\n  *::before,\n  *::after {\n    box-sizing: border-box;\n  }\n\n  /* Body reset */\n\n  body {\n    margin: 0;\n  }\n\n  body, input, textarea, button {\n    font-family: var(--font-family, ", "), Helvetica, Arial, sans-serif;\n  }\n\n  html,\n  body {\n    height: 100%;\n  }\n"])), desktopBallad.fontFamily);
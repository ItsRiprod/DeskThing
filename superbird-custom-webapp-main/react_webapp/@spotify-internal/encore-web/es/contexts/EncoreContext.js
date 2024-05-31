import React from 'react';
export var encoreContextStatus = {
  experimental: 'experimental',
  next: 'next',
  deprecated: 'deprecated'
};
export var encoreContextKeyword = {
  button: 'button'
};
export var EncoreContextDefault = {
  experimental: [],
  next: [],
  deprecated: []
};
export var hasStatus = function hasStatus(keyword, status) {
  return status.indexOf(keyword) > -1;
};
export var getStatus = function getStatus(keyword, config) {
  var lifecycle = undefined;
  var statusKeys = Object.keys(encoreContextStatus);
  statusKeys.forEach(function (status) {
    if (hasStatus(keyword, config[status])) lifecycle = status;
  });
  return lifecycle;
};
var EncoreContext = /*#__PURE__*/React.createContext(EncoreContextDefault);
EncoreContext.displayName = 'Encore';
export { EncoreContext };
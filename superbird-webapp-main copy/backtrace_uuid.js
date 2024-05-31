export const getBacktraceUuid = (chunk) => {
    const values = { '/static/js/main.js.map': '1E902F45-1F1F-209F-CE9D-87C2EF9BC129' };
    let uuid = values[chunk];
    if (uuid === undefined) uuid = values[Object.keys(values)[0]];
    return uuid;
  };
  
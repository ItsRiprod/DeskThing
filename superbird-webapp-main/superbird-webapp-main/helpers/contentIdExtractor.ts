/*
 Example input and output see tests fore more:
 spotify:space_item:superbird:superbird-featured -> featured
 spotify:spaces:superbird?blockIdentifier=superbird-featured -> featured
 */

export const parseCategoryId = function parseCategoryId(text: string) {
  const parsedText = text.endsWith('wrapper')
    ? text.split('-wrapper')[0]
    : text;
  const lastEqualChar = parsedText.lastIndexOf('=');
  const lastColonChar = parsedText.lastIndexOf(':');
  const lastDashChar = parsedText.lastIndexOf('-');

  const lastSplitChar = Math.max(lastEqualChar, lastColonChar, lastDashChar);
  return lastSplitChar !== -1
    ? parsedText.substring(lastSplitChar + 1)
    : parsedText;
};

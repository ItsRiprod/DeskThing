export const firstLetterUpperCase = function firstLetterUpperCase(
  text: string,
): string {
  if (!text) return text;
  return text.substr(0, 1).toUpperCase() + text.substr(1);
};

export const parsePinCodeSpacing = function parsePinCodeSpacing(
  text: string | undefined,
) {
  if (!text) return text;
  return text.substr(0, 3).concat(' ') + text.substr(3).trim();
};

export const removeAndCapitaliseAfterX = (text: string, cutAt: number) => {
  if (!text) return text;
  const newString = text.substr(cutAt);
  return newString.substr(0, 1) + newString.substr(1).toLowerCase();
};

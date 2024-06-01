// Simple time utility to convert various types of times to various other types of times (used in the progress bar)

export const msToTime = (duration: number): string => {
  let seconds: string | number = parseInt(String((duration / 1000) % 60), 10);
  let minutes: string | number = parseInt(String((duration / (1000 * 60)) % 60), 10);
  const hours = parseInt(String((duration / (1000 * 60 * 60)) % 24), 10);

  const renderedHours = hours === 0 ? '' : `${hours}:`;
  minutes = hours > 0 && minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;

  return `${renderedHours}${minutes}:${seconds}`;
};

export const msToMinutes = (duration: number): string => {
  let minutes: string | number = parseInt(String((duration / (1000 * 60)) % 60), 10);
  const hours = parseInt(String((duration / (1000 * 60 * 60)) % 24), 10);

  const renderedHours = hours === 0 ? '' : `${hours}hr `;
  minutes = `${minutes}min`;

  return `${renderedHours}${minutes}`;
};

export const secondsToMinutesFormat = (seconds: number): string => {
  if (seconds >= 60) {
    if (seconds >= 600) {
      return `${Math.floor(seconds / 60)}`;
    }
    return `0${Math.floor(seconds / 60)}`;
  }
  return '00';
};

export const secondsFormat = (seconds: number): string => {
  if (seconds % 60 < 10) {
    return `0${seconds % 60}`;
  }
  return `${seconds % 60}`;
};

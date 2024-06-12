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

export const stringToTime = (time: string): Date => {
  // Create a Date object from the ISO 8601 string e.g. 2024-06-06T17:00:00-04:00
  const dateParts = time.split(/[T\-:]/).map((part) => parseInt(part, 10));
  const date = new Date(
    Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], dateParts[3], dateParts[4], dateParts[5])
  );
  return date;
};

export const formatDate = (date: Date): string => {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert to 12-hour format
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes; // Add leading zero if needed
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

export const formatEpochTime = (epoch: number): string => {
  // Convert epoch to seconds
  const epochSeconds = epoch;

  // Calculate hours, minutes, and AM/PM
  let hours = Math.floor(epochSeconds / 3600) % 12;
  const minutes = Math.floor((epochSeconds % 3600) / 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Adjust hour for AM/PM format
  hours = hours === 0 ? 12 : hours;

  // Format the time as hour:minute AM/PM
  const timeString = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

  return timeString;
};

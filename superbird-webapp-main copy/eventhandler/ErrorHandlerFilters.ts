import InterappError from 'middleware/InterappError';

export type ErrorFilterFunction = (e: Error) => boolean;

export const no_wamp_session_destroyed: ErrorFilterFunction = (
  error: Error,
) => {
  return !(
    error instanceof InterappError &&
    error.message.indexOf('WampSession destroyed') >= 0
  );
};

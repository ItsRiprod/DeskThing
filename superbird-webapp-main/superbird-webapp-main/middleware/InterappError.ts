import { maskUsernames } from 'helpers/SpotifyUriUtil';

class InterappError extends Error {
  method: string;
  args: Object;

  constructor(message: string, method: string, args: Object) {
    super(message);
    this.method = method;
    this.args = maskUsernames(args);
  }
}

export default InterappError;

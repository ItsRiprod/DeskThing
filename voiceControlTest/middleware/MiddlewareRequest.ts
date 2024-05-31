/* eslint @typescript-eslint/no-explicit-any: 0 */
// @ts-nocheck
import Socket from 'Socket';
import callbackHandler from 'helpers/CallbackHandler';
import InterappError from './InterappError';

/**
 * Executes action or requests data from superbird middleware
 * @param method  Method name to execute
 * @param args  arguments to the request
 * @returns {Promise}
 */

class MiddlewareRequest {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
    this.socket.addSocketEventListener((msg) =>
      this.onMiddlewareCallResponse(msg),
    );
  }

  request(method: string, args: any = {}, userAction = true): Promise<any> {
    return new Promise<any>((resolve: Function, reject: Function) => {
      const msgId = callbackHandler.createMessage(resolve, reject);
      const message = {
        msgId: msgId,
        method: method,
        args: args,
        userAction, // Indicates if the request was triggered by the user, eg. false for logging
      };
      this.socket.post(message);
    });
  }

  onMiddlewareCallResponse(msg: any) {
    if (msg.type === 'call_result') {
      callbackHandler.fireMsgCallback(msg.msgId, msg.payload);
    } else if (msg.type === 'call_error') {
      callbackHandler.fireMsgCallback(msg.msgId, null, msg.payload);
    }
  }
}

export default MiddlewareRequest;

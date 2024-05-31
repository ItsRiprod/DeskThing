/* eslint @typescript-eslint/no-explicit-any: 0 */
// @ts-nocheck
/**
 * This module handles the asynchornous callback structure we use when communicating
 * with the middleware
 */

import InterappError from 'middleware/InterappError';

type Callback = {
  msgId: number;
  resolve: Function;
  reject: Function;
};

type CallbackHandler = {
  createMessage: () => number;
  fireMsgCallback: () => void;
  destroy: () => void;
};

const callbackHandler: CallbackHandler = {};

/**
 * Stores all the callbacks to keep track of. Key is the message ID.
 * @type {object}
 */
let callbacks = {};

/**
 * Counter that will assign each callback a unique ID.
 * 0 is reserved in middleware for "ignore result", so start at 1.
 * @type {number}
 */
let msgIdCounter = 1;

/**
 * Function to store a callback in the callbacks object and get the key (msgId) for it.
 */
callbackHandler.createMessage = (
  resolve: () => mixed,
  reject: () => mixed,
): number => {
  const msgId = msgIdCounter++;
  callbacks[msgId] = { msgId, resolve, reject };
  return msgId;
};
/**
 * Triggers the callback for the given msgId with the provided error and payload data
 *
 * @param  {number} msgId           The messageId for the callback that should be triggered
 * @param  {string} [result]       Any potential payload
 * @param  {number} [error]         Any potential errors
 */
callbackHandler.fireMsgCallback = (
  msgId: number,
  result: string | undefined,
  error?: Object,
) => {
  const cb = callbacks[msgId];
  if (cb) {
    const { resolve, reject } = cb;
    delete callbacks[msgId];
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  }
};

/**
 * Destroy this callbackHandler by removing all callbacks
 */
callbackHandler.destroy = () => {
  callbacks = {};
};

export default callbackHandler;

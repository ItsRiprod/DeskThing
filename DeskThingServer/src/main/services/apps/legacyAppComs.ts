import { LOGGING_LEVELS, SEND_TYPES, ToServerData } from '@deskthing/types'

type TypedRequestMap = {
  [K in SEND_TYPES]: {
    type: K
    request: Extract<ToServerData, { type: K }>['request']
  }
}

/**
 * Translates legacy type/request structure to the new type/request scheme
 * @param type - Legacy type
 * @param request - Legacy request
 * @returns {Object} New type and request structure
 */
export function translateLegacyTypeRequest(
  type: string,
  request?: string | unknown
): TypedRequestMap[keyof TypedRequestMap] {
  const legacyMap: Record<string, TypedRequestMap[keyof TypedRequestMap]> = {
    message: { type: SEND_TYPES.LOG, request: LOGGING_LEVELS.MESSAGE },
    'get:data': { type: SEND_TYPES.GET, request: 'data' },
    'get:config': { type: SEND_TYPES.GET, request: 'config' },
    'get:settings': { type: SEND_TYPES.GET, request: 'settings' },
    'get:input': { type: SEND_TYPES.GET, request: 'input' },
    set: { type: SEND_TYPES.SET, request: 'appData' },
    add: { type: SEND_TYPES.SET, request: 'appData' },
    open: { type: SEND_TYPES.OPEN, request: undefined },
    data: { type: SEND_TYPES.SEND, request: undefined },
    toApp: { type: SEND_TYPES.TOAPP, request: (request as string | undefined) || '' },
    error: { type: SEND_TYPES.LOG, request: LOGGING_LEVELS.ERROR },
    log: { type: SEND_TYPES.LOG, request: LOGGING_LEVELS.LOG },
    'button:add': { type: SEND_TYPES.KEY, request: 'add' },
    'button:remove': { type: SEND_TYPES.KEY, request: 'remove' },
    'key:add': { type: SEND_TYPES.KEY, request: 'add' },
    'key:remove': { type: SEND_TYPES.KEY, request: 'remove' },
    'action:add': { type: SEND_TYPES.ACTION, request: 'add' },
    'action:remove': { type: SEND_TYPES.ACTION, request: 'remove' },
    'action:update': { type: SEND_TYPES.ACTION, request: 'update' },
    'action:run': { type: SEND_TYPES.ACTION, request: 'run' }
  }

  const key = request ? `${type}:${request}` : type
  return legacyMap[key] || { type, request }
}

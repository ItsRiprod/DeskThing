import { LOGGING_LEVELS, APP_REQUESTS, AppToDeskThingData } from '@deskthing/types'

type TypedRequestMap = {
  [K in APP_REQUESTS]: {
    type: K
    request: Extract<AppToDeskThingData, { type: K }>['request']
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
    message: { type: APP_REQUESTS.LOG, request: LOGGING_LEVELS.MESSAGE },
    'get:data': { type: APP_REQUESTS.GET, request: 'data' },
    'get:config': { type: APP_REQUESTS.GET, request: 'config' },
    'get:settings': { type: APP_REQUESTS.GET, request: 'settings' },
    'get:input': { type: APP_REQUESTS.GET, request: 'input' },
    set: { type: APP_REQUESTS.SET, request: 'appData' },
    add: { type: APP_REQUESTS.SET, request: 'appData' },
    open: { type: APP_REQUESTS.OPEN, request: undefined },
    data: { type: APP_REQUESTS.SEND, request: undefined },
    toApp: { type: APP_REQUESTS.TOAPP, request: (request as string | undefined) || '' },
    error: { type: APP_REQUESTS.LOG, request: LOGGING_LEVELS.ERROR },
    log: { type: APP_REQUESTS.LOG, request: LOGGING_LEVELS.LOG },
    'button:add': { type: APP_REQUESTS.KEY, request: 'add' },
    'button:remove': { type: APP_REQUESTS.KEY, request: 'remove' },
    'key:add': { type: APP_REQUESTS.KEY, request: 'add' },
    'key:remove': { type: APP_REQUESTS.KEY, request: 'remove' },
    'action:add': { type: APP_REQUESTS.ACTION, request: 'add' },
    'action:remove': { type: APP_REQUESTS.ACTION, request: 'remove' },
    'action:update': { type: APP_REQUESTS.ACTION, request: 'update' },
    'action:run': { type: APP_REQUESTS.ACTION, request: 'run' }
  }

  const key = request ? `${type}:${request}` : type
  return legacyMap[key] || { type, request }
}

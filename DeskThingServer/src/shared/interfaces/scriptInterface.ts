/**
 * Script Interface that takes the parameters of just the adbServiceClass and a device ID and returns a string that is the result of a script being run
 */

import { ADBServiceClass } from '@shared/stores/adbServiceClass'

export type ScriptInterface = (
  adbService: ADBServiceClass,
  deviceId: string,
  force?: boolean
) => Promise<string>

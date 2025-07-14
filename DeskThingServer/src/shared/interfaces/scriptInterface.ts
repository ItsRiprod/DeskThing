/**
 * Script Interface that takes the parameters of just the adbServiceClass and a device ID and returns a string that is the result of a script being run
 */

import { ADBServiceClass } from '@shared/stores/adbServiceClass'
import { ScriptConfig } from '@shared/types'

export type ScriptInterface = (adbService: ADBServiceClass, config: ScriptConfig) => Promise<string>

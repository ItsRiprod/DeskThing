import { ClientPreferences } from '@deskthing/types'

/**
 * @deprecated - not added yet actually. Dont use this
 */
export interface Pending_Profile {
  version: string
  version_code: number
  id: string

  preferences: ClientPreferences

  // functional
  trigger_url?: string
  created: Date
  enabled: boolean

  // Vanity
  name?: string
  description?: string
  icon?: string
}

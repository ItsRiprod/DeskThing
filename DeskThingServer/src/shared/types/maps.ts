import { Action, ButtonMapping, EventMode, Key, Profile } from '@deskthing/types'

export type Button = {
  mode: EventMode // The mode of the button
  action: string // The action to be triggered
  key: string // The key to be triggered
  profile?: string // The profile to be used
}

export type MappingFileStructure = {
  selected_profile: Profile
  version: string
  version_code: number
  profiles: Record<string, Profile> // array of profile ids
  actions: Action[]
  keys: Key[]
}

export type MappingStructure = {
  selected_profile: Profile
  version: string
  version_code: number
  profiles: {
    default: ButtonMapping
    [key: string]: ButtonMapping
  }
  actions: Action[]
  keys: Key[]
}

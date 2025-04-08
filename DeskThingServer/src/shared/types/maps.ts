import { Action, ButtonMapping, Key, Profile } from '@deskthing/types'

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

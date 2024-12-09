export type Action = {
  name?: string // User Readable name
  description?: string // User Readable description
  id: string // System-level ID
  value?: string // The value to be passed to the action. This is included when the action is triggered
  value_options?: string[] // The options for the value
  value_instructions?: string // Instructions for the user to set the value
  icon?: string // The name of the icon the action uses - if left blank, the action will use the icon's id
  source: string // The origin of the action
  version: string // The version of the action
  version_code: number // The version of the server the action is compatible with
  enabled: boolean // Whether or not the app associated with the action is enabled
  tag?: 'nav' | 'media' | 'basic' // Tags associated with the action
}

export type Key = {
  id: string // System-level ID
  source: string // The origin of the key
  description?: string // User Readable description
  version: string //  The version of the key
  enabled: boolean // Whether or not the app associated with the key is enabled
  version_code?: number // The version of the server the action is compatible with
  modes: EventMode[] // The Modes of the key
}

export type Button = {
  mode: EventMode // The mode of the button
  action: string // The action to be triggered
  key: string // The key to be triggered
  profile?: string // The profile to be used
}

// The different possible modes of an event
export enum EventMode {
  KeyUp,
  KeyDown,
  ScrollUp,
  ScrollDown,
  ScrollLeft,
  ScrollRight,
  SwipeUp,
  SwipeDown,
  SwipeLeft,
  SwipeRight,
  PressShort,
  PressLong
}

export type ActionReference = {
  id: string
  value?: string
  enabled: boolean
  source: string
}

// The button mapping profile stored in the file system
export type Profile = {
  version: string
  version_code: number
  id: string
  name: string
  description?: string
  trigger_app?: string
  extends?: string
}

export interface ButtonMapping extends Profile {
  mapping: {
    [key: string]: {
      [Mode in EventMode]?: ActionReference
    }
  }
}

export type MappingFileStructure = {
  selected_profile: Profile
  version: string
  version_code: number
  profiles: Profile[] // array of profile ids
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

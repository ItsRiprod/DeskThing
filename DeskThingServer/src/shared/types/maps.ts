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
  enabled: boolean // Whether or not the app associated with the action is enabled
}

export type Key = {
  id: string // System-level ID
  source: string // The origin of the key
  description?: string // User Readable description
  version: string //  The version of the key
  enabled: boolean // Whether or not the app associated with the key is enabled
  Modes: EventMode[] // The Modes of the key
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

// The button mapping profile stored in the file system
export type ButtonMapping = {
  // The ID of the key
  version: string
  id: string
  name: string
  description?: string
  trigger_app?: string
  mapping: {
    [key: string]: {
      [Mode in EventMode]?: Action
    }
  }
}

export type MappingStructure = {
  selected_profile: string
  version: string
  profiles: {
    default: ButtonMapping
    [key: string]: ButtonMapping
  }
  actions: Action[]
  keys: Key[]
}

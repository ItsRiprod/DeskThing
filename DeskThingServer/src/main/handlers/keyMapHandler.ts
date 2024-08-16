import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { readFromFile, writeToFile } from '../utils/fileHandler'
import { sendMappings } from './websocketServer'

export type Action = {
  name: string
  id: string
  description: string
  source: string
  flair: string
}

export type Key = {
  id: string
  source: string
}

export enum EventFlavor {
  Up,
  Down,
  Left,
  Right,
  Short,
  Long
}

export type ButtonMapping = {
  [key: string]: {
    [flavor in EventFlavor]?: Action
  }
}

export type FileStructure = {
  default: ButtonMapping
  [key: string]: ButtonMapping | Action[] | Key[] | string
  actions: Action[]
  keys: Key[]
  version: string
}

const defaultData: FileStructure = {
  version: '0.8.1',
  default: {
    Pad1: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'VolUp',
        id: 'volUp',
        description: 'VolUp',
        source: 'server'
      }
    },
    Pad2: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'Swipe Left',
        id: 'swipeL',
        description: 'Goes to left app',
        source: 'server'
      }
    },
    Pad3: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'Swipe Right',
        id: 'swipeR',
        description: 'Goes to right app',
        source: 'server'
      }
    },
    Pad4: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'VolDown',
        id: 'volDown',
        description: 'VolDown',
        source: 'server'
      }
    },
    Pad5: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'Hide AppsList',
        id: 'hide',
        description: 'Hides the apps list',
        source: 'server'
      }
    },
    Pad6: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'Show AppsList',
        id: 'show',
        description: 'Shows the apps list',
        source: 'server'
      }
    },
    Pad7: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'Repeat',
        id: 'repeat',
        description: 'Repeat',
        source: 'server'
      }
    },
    Pad8: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'PlayPause',
        id: 'play',
        description: 'Plays or Pauses Audio',
        source: 'server'
      }
    },
    Pad9: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'Fullscreen',
        id: 'fullscreen',
        description: 'Fullscreens the application',
        source: 'server'
      }
    },
    DynamicAction1: {
      [EventFlavor.Down]: {
        name: 'Shuffle',
        id: 'shuffle',
        description: 'Shuffle',
        source: 'server',
        flair: ''
      }
    },
    DynamicAction2: {
      [EventFlavor.Down]: {
        name: 'Repeat',
        id: 'repeat',
        description: 'Repeat',
        source: 'server',
        flair: ''
      }
    },
    DynamicAction3: {
      [EventFlavor.Down]: {
        name: 'Rewind',
        id: 'rewind',
        flair: '',
        description: 'Rewind',
        source: 'server'
      }
    },
    DynamicAction4: {
      [EventFlavor.Down]: {
        name: 'Hidden Button',
        id: 'hidden',
        description: 'Hides the button. Has no action',
        source: 'server',
        flair: ''
      }
    },
    Action5: {
      [EventFlavor.Down]: {
        name: 'Hidden Button',
        id: 'hidden',
        description: 'Hides the button. Has no action',
        source: 'server',
        flair: ''
      }
    },
    Action6: {
      [EventFlavor.Down]: {
        name: 'PlayPause',
        id: 'play',
        flair: '',
        description: 'Plays or Pauses music',
        source: 'server'
      }
    },
    Action7: {
      [EventFlavor.Down]: {
        name: 'Skip',
        flair: '',
        id: 'skip',
        description: 'Skip',
        source: 'server'
      }
    },
    Digit1: {
      [EventFlavor.Short]: {
        name: 'Pref',
        flair: '',
        id: 'pref',
        description: 'Pref',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Swap',
        flair: '',
        id: 'swap',
        description: 'Swap',
        source: 'server'
      }
    },
    Digit2: {
      [EventFlavor.Short]: {
        name: 'Pref',
        flair: '',
        id: 'pref',
        description: 'Pref',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Swap',
        flair: '',
        id: 'swap',
        description: 'Swap',
        source: 'server'
      }
    },
    Digit3: {
      [EventFlavor.Short]: {
        name: 'Pref',
        flair: '',
        id: 'pref',
        description: 'Pref',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Swap',
        flair: '',
        id: 'swap',
        description: 'Swap',
        source: 'server'
      }
    },
    Digit4: {
      [EventFlavor.Short]: {
        name: 'Pref',
        flair: '',
        id: 'pref',
        description: 'Pref',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Swap',
        flair: '',
        id: 'swap',
        description: 'Swap',
        source: 'server'
      }
    },
    KeyM: {
      [EventFlavor.Short]: {
        flair: '',
        name: 'Dashboard',
        id: 'dashboard',
        description: 'Open Dashboard',
        source: 'server'
      },
      [EventFlavor.Long]: {
        flair: '',
        name: 'Utility',
        id: 'utility',
        description: 'Open Utility',
        source: 'server'
      }
    },
    Scroll: {
      [EventFlavor.Right]: {
        name: 'VolUp',
        flair: '',
        id: 'volUp',
        description: 'VolUp',
        source: 'server'
      },
      [EventFlavor.Up]: {
        name: 'VolUp',
        flair: '',
        id: 'volUp',
        description: 'VolUp',
        source: 'server'
      },
      [EventFlavor.Left]: {
        name: 'VolDown',
        id: 'volDown',
        description: 'VolDown',
        flair: '',
        source: 'server'
      },
      [EventFlavor.Down]: {
        name: 'VolDown',
        id: 'volDown',
        flair: '',
        description: 'VolDown',
        source: 'server'
      }
    },
    Enter: {
      [EventFlavor.Down]: {
        name: 'PlayPause',
        id: 'playPause',
        description: 'PlayPause',
        flair: '',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Skip',
        flair: '',
        id: 'skip',
        description: 'Skip',
        source: 'server'
      }
    },
    Escape: {
      [EventFlavor.Down]: {
        name: 'Repeat',
        id: 'repeat',
        description: 'Repeat',
        flair: '',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Repeat',
        flair: '',
        id: 'repeat',
        description: 'Repeat',
        source: 'server'
      }
    },
    Swipe: {
      [EventFlavor.Up]: {
        name: 'Hide AppsList',
        id: 'hide',
        description: 'Hides the apps list',
        flair: '',
        source: 'server'
      },
      [EventFlavor.Down]: {
        name: 'Show AppsList',
        id: 'show',
        description: 'Shows the apps list',
        flair: '',
        source: 'server'
      },
      [EventFlavor.Left]: {
        name: 'Swipe Left',
        id: 'swipeL',
        description: 'Goes to left app',
        flair: '',
        source: 'server'
      },
      [EventFlavor.Right]: {
        name: 'Swipe Right',
        id: 'swipeR',
        description: 'Goes to right app',
        flair: '',
        source: 'server'
      }
    }
  },
  actions: [
    { name: 'Shuffle', id: 'shuffle', description: 'Shuffle', source: 'server', flair: '' },
    { name: 'Rewind', id: 'rewind', description: 'Rewind', source: 'server', flair: '' },
    { name: 'PlayPause', id: 'playPause', description: 'PlayPause', source: 'server', flair: '' },
    { name: 'Skip', id: 'skip', description: 'Skip', source: 'server', flair: '' },
    { name: 'Repeat', id: 'repeat', description: 'Repeat', source: 'server', flair: '' },
    { name: 'Pref', id: 'pref', description: 'Change the View', source: 'server', flair: '' },
    { name: 'Swap', id: 'swap', description: 'Swap', source: 'server', flair: '' },
    { name: 'VolDown', id: 'volDown', description: 'VolDown', source: 'server', flair: '' },
    { name: 'VolUp', id: 'volUp', description: 'VolUp', source: 'server', flair: '' },
    { flair: '', name: 'Utility', id: 'utility', description: 'Open Utility', source: 'server' },
    {
      flair: '',
      name: 'Dashboard',
      id: 'dashboard',
      description: 'Open Dashboard',
      source: 'server'
    },
    { flair: '', name: 'Landing', id: 'landing', description: 'Open Landing', source: 'server' },
    {
      name: 'Hide AppsList',
      id: 'hide',
      description: 'Hides the apps list',
      source: 'server',
      flair: ''
    },
    {
      name: 'Show AppsList',
      id: 'show',
      description: 'Shows the apps list',
      source: 'server',
      flair: ''
    },
    {
      name: 'Swipe Left',
      id: 'swipeL',
      description: 'Goes to left app',
      source: 'server',
      flair: ''
    },
    {
      name: 'Swipe Right',
      id: 'swipeR',
      description: 'Goes to right app',
      source: 'server',
      flair: ''
    },
    {
      name: 'Hidden Button',
      id: 'hidden',
      description: 'Hides the button. Has no action',
      source: 'server',
      flair: ''
    },
    {
      name: 'Fullscreen',
      id: 'fullscreen',
      description: 'Toggle Fullscreen',
      source: 'server',
      flair: ''
    }
  ],
  keys: [
    { id: 'DynamicAction1', source: 'server' },
    { id: 'DynamicAction2', source: 'server' },
    { id: 'DynamicAction3', source: 'server' },
    { id: 'DynamicAction4', source: 'server' },
    { id: 'Action5', source: 'server' },
    { id: 'Action6', source: 'server' },
    { id: 'Action7', source: 'server' },
    { id: 'Digit1', source: 'server' },
    { id: 'Digit2', source: 'server' },
    { id: 'Digit3', source: 'server' },
    { id: 'Digit4', source: 'server' },
    { id: 'KeyM', source: 'server' },
    { id: 'Scroll', source: 'server' },
    { id: 'Enter', source: 'server' },
    { id: 'Swipe', source: 'server' },
    { id: 'Escape', source: 'server' },
    { id: 'Pad1', source: 'server' },
    { id: 'Pad2', source: 'server' },
    { id: 'Pad3', source: 'server' },
    { id: 'Pad4', source: 'server' },
    { id: 'Pad5', source: 'server' },
    { id: 'Pad6', source: 'server' },
    { id: 'Pad7', source: 'server' },
    { id: 'Pad8', source: 'server' },
    { id: 'Pad9', source: 'server' }
  ]
}

const loadMappings = (): FileStructure => {
  const data = readFromFile('mappings.json') as FileStructure
  if (!data || data?.version !== defaultData.version) {
    dataListener.emit(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Mappings file is corrupt or does not exist, using default`
    )
    writeToFile(defaultData, 'mappings.json')
    return defaultData
  }
  const parsedData = data as FileStructure
  try {
    validateFileStructure(parsedData)
  } catch (Error) {
    dataListener.emit(MESSAGE_TYPES.ERROR, `MAPHANDLER: Mappings file is corrupt, using default`)
    writeToFile(defaultData, 'mappings.json')
    return defaultData
  }
  return parsedData
}

const saveMappings = (mappings: FileStructure): void => {
  try {
    validateFileStructure(mappings)
    writeToFile(mappings, 'mappings.json')
  } catch (Error) {
    dataListener.emit(MESSAGE_TYPES.ERROR, `MAPHANDLER: New Mappings file is corrupt`)
  }
}

const getMappings = (mappingName: string = 'default'): ButtonMapping => {
  const mappings = loadMappings()
  if (!(mappingName in mappings)) {
    dataListener.emit(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Mapping ${mappingName} does not exist, using default`
    )
    throw new Error(`Mapping ${mappingName} does not exist`)
  }
  return mappings[mappingName] as ButtonMapping
}

const setMappings = (mappingName: string, newMappings: ButtonMapping): void => {
  const mappings = loadMappings()
  mappings[mappingName] = newMappings
  saveMappings(mappings)
  dataListener.emit(MESSAGE_TYPES.LOGGING, 'MAPHANDLER: Map saved successfully!')
  sendMappings()
}

const getDefaultMappings = (): ButtonMapping => {
  const mappings = loadMappings()
  return mappings.default
}

const setDefaultMappings = (defaultMappings: ButtonMapping): void => {
  const mappings = loadMappings()
  mappings.default = defaultMappings
  saveMappings(mappings)
}

const validateButtonMapping = (mapping: ButtonMapping): void => {
  for (const [key, flavors] of Object.entries(mapping)) {
    if (typeof key !== 'string') throw new Error(`Invalid key: ${key}`)
    if (typeof flavors !== 'object') throw new Error(`Invalid value for key: ${key}`)

    for (const [flavor, action] of Object.entries(flavors)) {
      if (!Object.values(EventFlavor).includes(Number(flavor))) {
        throw new Error(`Invalid event flavor: ${flavor} for key: ${key}`)
      }
      if (
        !action ||
        typeof action !== 'object' ||
        !action.name ||
        !action.id ||
        !action.description ||
        !action.source
      ) {
        throw new Error(`Invalid action entry for flavor: ${flavor} in key: ${key}`)
      }
    }
  }
}

const validateFileStructure = (structure: FileStructure): void => {
  if (typeof structure.version !== 'string') throw new Error('Invalid version')
  if (typeof structure.default !== 'object') throw new Error('Invalid default mapping')
  validateButtonMapping(structure.default)

  if (!Array.isArray(structure.actions)) throw new Error('Invalid actions array')
  structure.actions.forEach((func, index) => {
    if (typeof func !== 'object' || !func.name || !func.description || !func.source) {
      throw new Error(`Invalid function entry at index: ${index}`)
    }
  })

  if (!Array.isArray(structure.keys)) throw new Error('Invalid keys array')
  structure.keys.forEach((key, index) => {
    if (typeof key !== 'object' || !key.id || !key.source) {
      throw new Error(`Invalid key entry at index: ${index}`)
    }
  })
}

const addButton = (button: Action, key: string, flavor: EventFlavor): void => {
  const mappings = loadMappings()
  if (!mappings.default) throw new Error('Default mappings are missing')
  if (!mappings.default[key]) {
    mappings.default[key] = {}
  }
  mappings.default[key][flavor] = button
  saveMappings(mappings)
}

const removeButton = (key: string, flavor: EventFlavor): void => {
  const mappings = loadMappings()
  if (!mappings.default) throw new Error('Default mappings are missing')
  if (!(key in mappings.default)) throw new Error(`Button with key ${key} does not exist`)
  delete mappings.default[key][flavor]
  if (Object.keys(mappings.default[key]).length === 0) {
    delete mappings.default[key]
  }
  saveMappings(mappings)
}

const addKey = (key: Key): void => {
  const mappings = loadMappings()
  if (!Array.isArray(mappings.keys)) throw new Error('Keys array is missing')
  if (mappings.keys.some((existingKey) => existingKey.id === key.id)) {
    throw new Error(`Key with id ${key.id} already exists`)
  }
  mappings.keys.push(key)
  saveMappings(mappings)
}

const removeKey = (keyId: string): void => {
  const mappings = loadMappings()
  if (!Array.isArray(mappings.keys)) throw new Error('Keys array is missing')
  const index = mappings.keys.findIndex((key) => key.id === keyId)
  if (index === -1) throw new Error(`Key with id ${keyId} does not exist`)
  mappings.keys.splice(index, 1)
  saveMappings(mappings)
}

const addAction = (action: Action): void => {
  const mappings = loadMappings()
  if (!Array.isArray(mappings.actions)) throw new Error('Actions array is missing')
  if (mappings.actions.some((existingActions) => existingActions.id === action.id)) {
    throw new Error(`Key with id ${action.id} already exists`)
  }
  mappings.actions.push(action)
  saveMappings(mappings)
}

const removeAction = (actionId: string): void => {
  const mappings = loadMappings()
  if (!Array.isArray(mappings.actions)) throw new Error('Actions array is missing')
  const index = mappings.actions.findIndex((actions) => actions.id === actionId)
  if (index === -1) throw new Error(`Action with id ${actionId} does not exist`)
  mappings.actions.splice(index, 1)
  saveMappings(mappings)
}

const removeAppData = (appId: string): void => {
  const mappings = loadMappings()

  // Remove actions associated with the appId
  mappings.actions = mappings.actions.filter((action) => action.source !== appId)

  // Remove keys associated with the appId
  mappings.keys = mappings.keys.filter((key) => key.source !== appId)

  // Replace instances of these actions in the default mapping with placeholder data
  Object.keys(mappings.default).forEach((key) => {
    const buttonMapping = mappings.default[key]
    Object.keys(buttonMapping).forEach((flavor) => {
      const action = buttonMapping[flavor]
      if (action && action.source === appId) {
        // Replace with placeholder action (you can customize the placeholder as needed)
        buttonMapping[flavor] = {
          flair: '',
          name: 'Removed',
          id: 'removed',
          description: 'App Removed',
          source: 'server'
        }
      }
    })
  })

  // Save updated mappings
  saveMappings(mappings)

  // Send updated mappings to listeners
  sendMappings()
}

export {
  loadMappings,
  getMappings,
  setMappings,
  getDefaultMappings,
  setDefaultMappings,
  addButton,
  removeButton,
  addKey,
  removeKey,
  addAction,
  removeAction,
  removeAppData
}

import { Action, ButtonMapping, EventFlavor, FileStructure, Key } from '../types'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { readFromFile, writeToFile } from '../utils/fileHandler'
import { sendMappings } from './websocketServer'

const defaultData: FileStructure = {
  version: '0.9.0',
  default: {
    Pad1: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'VolUp',
        id: 'volUp',
        description: 'Turns the volume up',
        source: 'server'
      }
    },
    Pad2: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'Swipe Left',
        id: 'swipeL',
        description: 'Swipes to left app',
        source: 'server'
      }
    },
    Pad3: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'Swipe Right',
        id: 'swipeR',
        description: 'Swipes to right app',
        source: 'server'
      }
    },
    Pad4: {
      [EventFlavor.Down]: {
        flair: '',
        name: 'VolDown',
        id: 'volDown',
        description: 'Turns down the volume',
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
        description: 'Repeats the song',
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
        description: 'Attempts to Fullscreen the application (Does not work on IOS)',
        source: 'server'
      }
    },
    DynamicAction1: {
      [EventFlavor.Down]: {
        name: 'Shuffle',
        id: 'shuffle',
        description: 'Shuffles the current song',
        source: 'server',
        flair: ''
      }
    },
    DynamicAction2: {
      [EventFlavor.Down]: {
        name: 'Repeat',
        id: 'repeat',
        description: 'Repeats the song',
        source: 'server',
        flair: ''
      }
    },
    DynamicAction3: {
      [EventFlavor.Down]: {
        name: 'Rewind',
        id: 'rewind',
        flair: '',
        description: 'Rewinds the song',
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
        description: 'Skips the track',
        source: 'server'
      }
    },
    Digit1: {
      [EventFlavor.Short]: {
        name: 'Pref',
        flair: '',
        id: 'pref',
        description: 'Sets the preference to the current digit (i.e digit1 = pref1)',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Swap',
        flair: '',
        id: 'swap',
        description: 'Swaps the current view with the pressed one (i.e digit1 = preset1)',
        source: 'server'
      }
    },
    Digit2: {
      [EventFlavor.Short]: {
        name: 'Pref',
        flair: '',
        id: 'pref',
        description: 'Sets the preference to the current digit (i.e digit1 = pref1)',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Swap',
        flair: '',
        id: 'swap',
        description: 'Swaps the current view with the pressed one (i.e digit1 = preset1)',
        source: 'server'
      }
    },
    Digit3: {
      [EventFlavor.Short]: {
        name: 'Pref',
        flair: '',
        id: 'pref',
        description: 'Sets the preference to the current digit (i.e digit1 = pref1)',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Swap',
        flair: '',
        id: 'swap',
        description: 'Swaps the current view with the pressed one (i.e digit1 = preset1)',
        source: 'server'
      }
    },
    Digit4: {
      [EventFlavor.Short]: {
        name: 'Pref',
        flair: '',
        id: 'pref',
        description: 'Sets the preference to the current digit (i.e digit1 = pref1)',
        source: 'server'
      },
      [EventFlavor.Long]: {
        name: 'Swap',
        flair: '',
        id: 'swap',
        description: 'Swaps the current view with the pressed one (i.e digit1 = preset1)',
        source: 'server'
      }
    },
    KeyM: {
      [EventFlavor.Short]: {
        flair: '',
        name: 'Dashboard',
        id: 'dashboard',
        description: 'Opens Dashboard',
        source: 'server'
      },
      [EventFlavor.Long]: {
        flair: '',
        name: 'Utility',
        id: 'utility',
        description: 'Opens Utility',
        source: 'server'
      }
    },
    Scroll: {
      [EventFlavor.Right]: {
        name: 'VolUp',
        flair: '',
        id: 'volUp',
        description: 'Turns the volume up',
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
        id: 'play',
        description: 'play',
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
      [EventFlavor.Short]: {
        flair: '',
        name: 'Show AppsList',
        id: 'show',
        description: 'Shows the apps list',
        source: 'server'
      },
      [EventFlavor.Long]: {
        flair: '',
        name: 'Hide AppsList',
        id: 'hide',
        description: 'Hides the apps list',
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
    {
      name: 'Shuffle',
      id: 'shuffle',
      description: 'Shuffles the song',
      source: 'server',
      flair: ''
    },
    { name: 'Rewind', id: 'rewind', description: 'Rewinds the song', source: 'server', flair: '' },
    {
      name: 'PlayPause',
      id: 'play',
      description: 'Plays or Pauses the song',
      source: 'server',
      flair: ''
    },
    { name: 'Skip', id: 'skip', description: 'Skips the song', source: 'server', flair: '' },
    { name: 'Repeat', id: 'repeat', description: 'Toggles repeat', source: 'server', flair: '' },
    { name: 'Pref', id: 'pref', description: 'Change the View', source: 'server', flair: '' },
    {
      name: 'Swap',
      id: 'swap',
      description: 'Swaps the current view with the selected one',
      source: 'server',
      flair: ''
    },
    {
      name: 'VolDown',
      id: 'volDown',
      description: 'Turns the volume up',
      source: 'server',
      flair: ''
    },
    {
      name: 'VolUp',
      id: 'volUp',
      description: 'Turns the volume down',
      source: 'server',
      flair: ''
    },
    { name: 'Utility', id: 'utility', description: 'Opens Utility', source: 'server', flair: '' },
    {
      name: 'Dashboard',
      id: 'dashboard',
      description: 'Opens Dashboard',
      source: 'server',
      flair: ''
    },
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
    {
      description:
        'DynamicAction1 The First bottom Mniplayer that only shows when the song title is tapped',
      id: 'DynamicAction1',
      source: 'server'
    },
    {
      description:
        'DynamicAction2 The Second bottom Mniplayer that only shows when the song title is tapped',
      id: 'DynamicAction2',
      source: 'server'
    },
    {
      description:
        'DynamicAction3 The Third bottom Mniplayer that only shows when the song title is tapped',
      id: 'DynamicAction3',
      source: 'server'
    },
    {
      description:
        'DynamicAction4 The Fourth bottom Mniplayer that only shows when the song title is tapped',
      id: 'DynamicAction4',
      source: 'server'
    },
    {
      description: 'Action5 The Fifth bottom Mniplayer that always show',
      id: 'Action5',
      source: 'server'
    },
    {
      description: 'Action6 The Sixth bottom Mniplayer that always show',
      id: 'Action6',
      source: 'server'
    },
    {
      description: 'Action7 The Seventh bottom Mniplayer that always show',
      id: 'Action7',
      source: 'server'
    },
    { description: 'Physical Button Digit1', id: 'Digit1', source: 'server' },
    { description: 'Physical Button Digit2', id: 'Digit2', source: 'server' },
    { description: 'Physical Button Digit3', id: 'Digit3', source: 'server' },
    { description: 'Physical Button Digit4', id: 'Digit4', source: 'server' },
    { description: 'Physical Button KeyM', id: 'KeyM', source: 'server' },
    { description: 'Physical Button Scroll', id: 'Scroll', source: 'server' },
    { description: 'Physical Button Enter', id: 'Enter', source: 'server' },
    { description: 'Physical Button Swipe', id: 'Swipe', source: 'server' },
    { description: 'Physical Button Escape', id: 'Escape', source: 'server' },
    {
      description: 'Touch Pad1 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad1',
      source: 'server'
    },
    {
      description: 'Touch Pad2 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad2',
      source: 'server'
    },
    {
      description: 'Touch Pad3 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad3',
      source: 'server'
    },
    {
      description: 'Touch Pad4 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad4',
      source: 'server'
    },
    {
      description: 'Touch Pad5 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad5',
      source: 'server'
    },
    {
      description: 'Touch Pad6 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad6',
      source: 'server'
    },
    {
      description: 'Touch Pad7 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad7',
      source: 'server'
    },
    {
      description: 'Touch Pad8 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad8',
      source: 'server'
    },
    {
      description: 'Touch Pad9 on the fullscsreen miniplayer view. Numbered LTR Top to bottom',
      id: 'Pad9',
      source: 'server'
    }
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

/**
 * Removes all keys and mappings relating to the App
 * @param appId The ID of the app to remove
 */
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

const updateFlair = (id: string, flair: string): void => {
  const mappings = loadMappings()
  if (!mappings.default) throw new Error('Default mappings are missing')

  console.log('Updating flair for id:', id, 'with flair:', flair)
  // Update flair for all actions with the given id
  if (Array.isArray(mappings.actions)) {
    mappings.actions = mappings.actions.map((action) => {
      if (action.id === id) {
        return { ...action, flair }
      }
      return action
    })
  }

  // Update flair in default mappings
  Object.keys(mappings.default).forEach((key) => {
    const buttonMapping = mappings.default[key]
    Object.keys(buttonMapping).forEach((flavor) => {
      const action = buttonMapping[flavor]
      if (action && action.id === id) {
        buttonMapping[flavor] = { ...action, flair }
      }
    })
  })

  saveMappings(mappings)
  sendMappings()
}

export {
  updateFlair,
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

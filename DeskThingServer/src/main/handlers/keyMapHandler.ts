import { readFromFile, writeToFile } from '../utils/fileHandler'

export type Button = {
  name: string
  description: string
  source: string
}

export type key = {
  id: string
  source: string
}

export type ButtonMapping = {
  [key: string]: Button
}

export type FileStructure = {
  default: ButtonMapping
  [key: string]: ButtonMapping | Button[] | key[] | string
  functions: Button[]
  keys: key[]
  version: string
}

const defaultData: FileStructure = {
  version: '0.6.0',
  default: {
    tray1: { name: 'Skip', description: 'Shuffle', source: 'server' },
    tray2: { name: 'Rewind', description: 'Rewind', source: 'server' },
    tray3: { name: 'PlayPause', description: 'PlayPause', source: 'server' },
    tray4: { name: 'Skip', description: 'Skip', source: 'server' },
    tray5: { name: 'Repeat', description: 'Repeat', source: 'server' },
    button1: { name: 'Pref1', description: 'Pref1', source: 'server' },
    button2: { name: 'Pref2', description: 'Pref2', source: 'server' },
    button3: { name: 'Pref3', description: 'Pref3', source: 'server' },
    button4: { name: 'Pref4', description: 'Pref4', source: 'server' },
    button1_long: { name: 'Swap', description: 'Swap', source: 'server' },
    button2_long: { name: 'Swap', description: 'Swap', source: 'server' },
    button3_long: { name: 'Swap', description: 'Swap', source: 'server' },
    button4_long: { name: 'Swap', description: 'Swap', source: 'server' },
    dial_scroll_right: { name: 'VolDown', description: 'VolDown', source: 'server' },
    dial_scroll_left: { name: 'VolUp', description: 'VolUp', source: 'server' },
    dial_press: { name: 'PlayPause', description: 'PlayPause', source: 'server' },
    dial_press_long: { name: 'Skip', description: 'Skip', source: 'server' },
    face_press: { name: 'Repeat', description: 'Repeat', source: 'server' },
    face_long: { name: 'Repeat', description: 'Repeat', source: 'server' }
  },
  functions: [
    { name: 'Shuffle', description: 'Shuffle', source: 'server' },
    { name: 'Rewind', description: 'Rewind', source: 'server' },
    { name: 'PlayPause', description: 'PlayPause', source: 'server' },
    { name: 'Skip', description: 'Skip', source: 'server' },
    { name: 'Repeat', description: 'Repeat', source: 'server' },
    { name: 'Pref1', description: 'Pref1', source: 'server' },
    { name: 'Pref2', description: 'Pref2', source: 'server' },
    { name: 'Pref3', description: 'Pref3', source: 'server' },
    { name: 'Pref4', description: 'Pref4', source: 'server' },
    { name: 'Swap', description: 'Swap', source: 'server' },
    { name: 'Swap', description: 'Swap', source: 'server' },
    { name: 'Swap', description: 'Swap', source: 'server' },
    { name: 'Swap', description: 'Swap', source: 'server' },
    { name: 'VolDown', description: 'VolDown', source: 'server' },
    { name: 'VolUp', description: 'VolUp', source: 'server' },
    { name: 'PlayPause', description: 'PlayPause', source: 'server' },
    { name: 'Skip', description: 'Skip', source: 'server' },
    { name: 'Repeat', description: 'Repeat', source: 'server' },
    { name: 'Repeat', description: 'Repeat', source: 'server' }
  ],
  keys: [
    { id: 'tray1', source: 'server' },
    { id: 'tray2', source: 'server' },
    { id: 'tray3', source: 'server' },
    { id: 'tray4', source: 'server' },
    { id: 'tray5', source: 'server' },
    { id: 'button1', source: 'server' },
    { id: 'button2', source: 'server' },
    { id: 'button3', source: 'server' },
    { id: 'button4', source: 'server' },
    { id: 'button1_long', source: 'server' },
    { id: 'button2_long', source: 'server' },
    { id: 'button3_long', source: 'server' },
    { id: 'button4_long', source: 'server' },
    { id: 'dial_scroll_right', source: 'server' },
    { id: 'dial_scroll_left', source: 'server' },
    { id: 'dial_press', source: 'server' },
    { id: 'dial_press_long', source: 'server' },
    { id: 'face_press', source: 'server' },
    { id: 'face_long', source: 'server' }
  ]
}

const loadMappings = (): FileStructure => {
  const data = readFromFile('mappings.json')
  if (!data) {
    writeToFile(defaultData, 'mappings.json')
    return defaultData
  }
  const parsedData = data as FileStructure
  validateFileStructure(parsedData)
  return parsedData
}

const saveMappings = (mappings: FileStructure): void => {
  validateFileStructure(mappings)
  writeToFile(mappings, 'mappings.json')
}

const getMappings = (): FileStructure => {
  return loadMappings()
}

const setMappings = (newMappings: FileStructure): void => {
  saveMappings(newMappings)
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
  for (const [key, button] of Object.entries(mapping)) {
    if (typeof key !== 'string') throw new Error(`Invalid key: ${key}`)
    if (typeof button !== 'object' || !button.name || !button.description || !button.source) {
      throw new Error(`Invalid button entry for key: ${key}`)
    }
  }
}

const validateFileStructure = (structure: FileStructure): void => {
  if (typeof structure.version !== 'string') throw new Error('Invalid version')
  if (typeof structure.default !== 'object') throw new Error('Invalid default mapping')
  validateButtonMapping(structure.default)

  if (!Array.isArray(structure.functions)) throw new Error('Invalid functions array')
  structure.functions.forEach((func, index) => {
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

const addButton = (button: Button, key: string): void => {
  const mappings = loadMappings()
  if (!mappings.default) throw new Error('Default mappings are missing')
  mappings.default[key] = button
  saveMappings(mappings)
}

const removeButton = (key: string): void => {
  const mappings = loadMappings()
  if (!mappings.default) throw new Error('Default mappings are missing')
  if (!(key in mappings.default)) throw new Error(`Button with key ${key} does not exist`)
  delete mappings.default[key]
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

export {
  getMappings,
  setMappings,
  getDefaultMappings,
  setDefaultMappings,
  addButton,
  removeButton,
  addKey,
  removeKey
}

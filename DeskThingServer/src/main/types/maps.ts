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

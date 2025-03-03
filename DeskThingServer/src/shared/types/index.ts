export * from './types'
export * from './app'
export * from './maps'
export * from './ipcTypes'
export * from './feedback'
export * from './connection'

export enum TerritoriesIDs {
  STATE5 = 'STATE5',
  STATE4 = 'STATE4',
  STATE3 = 'STATE3',
  STATE2 = 'STATE2',
  STATE1 = 'STATE1'
}

export enum ContinentsIDs {
  US = 'US',
  CA = 'CA',
  EU = 'EU',
  UK = 'UK',
  AU = 'AU'
}

export type World = {
  id: string
  name: string
  continents: Continent[]
}

export type Continent = {
  id: ContinentsIDs
  name: string
  continents: ContinentsIDs[]
} & (
  | {
      id: ContinentsIDs.US
      name: 'United States'
      continents: [
        TerritoriesIDs.STATE1,
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
  | {
      id: ContinentsIDs.CA
      name: 'Canada'
      continents: [
        TerritoriesIDs.STATE1,
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
  | {
      id: ContinentsIDs.EU
      name: 'Europe'
      continents: [
        TerritoriesIDs.STATE1,
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
  | {
      id: ContinentsIDs.UK
      name: 'United Kingdom'
      continents: [
        TerritoriesIDs.STATE1,
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
  | {
      id: ContinentsIDs.AU
      name: 'Australia'
      continents: [
        TerritoriesIDs.STATE1,
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
)

export type Territories = {
  id: TerritoriesIDs
  occupiedBy: number
  troopCount: number
  neighbors: TerritoriesIDs[]
} & (
  | {
      id: TerritoriesIDs.STATE1
      name: 'United States'
      neighbors: [
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
  | {
      id: TerritoriesIDs.STATE2
      name: 'Canada'
      neighbors: [
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
  | {
      id: TerritoriesIDs.STATE3
      name: 'Europe'
      neighbors: [
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
  | {
      id: TerritoriesIDs.STATE4
      name: 'United Kingdom'
      neighbors: [
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
  | {
      id: TerritoriesIDs.STATE5
      name: 'Australia'
      neighbors: [
        TerritoriesIDs.STATE2,
        TerritoriesIDs.STATE3,
        TerritoriesIDs.STATE4,
        TerritoriesIDs.STATE5
      ]
    }
)

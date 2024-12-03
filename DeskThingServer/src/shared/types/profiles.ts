import { App } from './app'

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

export interface ClientPreferences {
  miniplayer?: MiniplayerSettings
  appTrayState: ViewMode
  volume: VolMode
  theme?: Theme
  currentView?: App
  ShowNotifications: boolean
  Screensaver: App
}

export interface MiniplayerSettings {
  state: ViewMode
  visible: boolean
  position: 'bottom' | 'left' | 'right'
}

export interface Theme {
  primary: string
  textLight: string
  textDark: string
  icons: string
  background: string
  scale: 'small' | 'medium' | 'large'
}

export enum VolMode {
  WHEEL = 'wheel',
  SLIDER = 'slider',
  BAR = 'bar'
}
export enum ViewMode {
  HIDDEN = 'hidden',
  PEEK = 'peek',
  FULL = 'full'
}

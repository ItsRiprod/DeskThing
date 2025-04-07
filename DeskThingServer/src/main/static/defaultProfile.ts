import { DeskThingProfile } from '@deskthing/types'
import { defaultMappingProfile } from './defaultButtons'
import { defaultConfig } from './defaultConfig'

const defaultProfile: DeskThingProfile = {
  id: 'default-profile',
  label: 'Default Profile',
  version: '0.11.0',
  created: new Date(),
  enabled: true,
  mapping: defaultMappingProfile,
  clientConfig: defaultConfig,
  description: 'Default DeskThing Profile',
  colors: {
    background: '#ffffff',
    text: '#1a3327',
    accent: '#22c55e',
    highlight: '#dcfce7'
  }
}

export default defaultProfile

import { AppReleaseFile, ClientReleaseFile } from '@shared/types'

export const defaultAppReleaseData: AppReleaseFile = {
  version: '0.10.4',
  references: [],
  releases: [],
  timestamp: 0
}

export const defaultClientReleaseFile: ClientReleaseFile = {
  version: '0.10.4',
  repositories: ['https://github.com/itsriprod/Deskthing-Client/'],
  releases: [],
  timestamp: 0
}

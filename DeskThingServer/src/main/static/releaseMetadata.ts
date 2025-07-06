import { AppReleaseFile01111, ClientReleaseFile01111 } from '@shared/types'

export const latestAppReleaseVersion = '0.11.11'

export const appsRepo = 'https://api.github.com/repos/itsriprod/deskthing-apps'
export const defaultAppLatestJSONFallback: AppReleaseFile01111 = {
  version: '0.11.11',
  type: 'app',
  repositories: [appsRepo],
  releases: [],
  timestamp: 0
}

export const latestClientReleaseVersion = '0.11.11'

export const clientRepo = 'https://api.github.com/repos/itsriprod/deskthing-client'
export const defaultClientLatestJSONFallback: ClientReleaseFile01111 = {
  version: '0.11.11',
  type: 'client',
  repositories: [clientRepo],
  releases: [],
  timestamp: 0
}

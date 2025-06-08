import { AppReleaseFile0118, ClientReleaseFile0118 } from '@shared/types'

export const latestAppReleaseVersion = '0.11.8'

export const appsRepo = 'https://api.github.com/repos/itsriprod/deskthing-apps'
export const defaultAppLatestJSONFallback: AppReleaseFile0118 = {
  version: '0.11.8',
  repositories: [appsRepo],
  releases: [],
  timestamp: 0
}

export const latestClientReleaseVersion = '0.11.8'

export const clientRepo = 'https://api.github.com/repos/itsriprod/deskthing-client'
export const defaultClientLatestJSONFallback: ClientReleaseFile0118 = {
  version: '0.11.8',
  repositories: [clientRepo],
  releases: [],
  timestamp: 0
}

import { AppReleaseCommunity, AppReleaseMeta, AppReleaseSingleMeta } from '@deskthing/types'
import { AppReleaseFile } from '@shared/types'

export const isValidAppReleaseFile: (
  releaseFile: unknown
) => asserts releaseFile is AppReleaseFile = (releaseFile) => {
  if (!releaseFile) {
    throw new Error('[isValidAppReleaseFile] Invalid release file')
  }
  if (typeof releaseFile !== 'object') {
    throw new Error('[isValidAppReleaseFile] Release file is not an object')
  }
  if (!('version' in releaseFile)) {
    throw new Error('[isValidAppReleaseFile] Release file does not have a version')
  }
  if (!('references' in releaseFile)) {
    throw new Error('[isValidAppReleaseFile] Release file does not have a references')
  }
  if (!('releases' in releaseFile)) {
    throw new Error('[isValidAppReleaseFile] Release file does not have a releases')
  }
  if (!Array.isArray(releaseFile.references)) {
    throw new Error('[isValidAppReleaseFile] Release file references is not an array')
  }
  if (!Array.isArray(releaseFile.releases)) {
    throw new Error('[isValidAppReleaseFile] Release file releases is not an array')
  }
  releaseFile.releases.map((release) => {
    if (!('type' in release) || typeof release.type !== 'string') {
      throw new Error('[isValidAppReleaseFile] Release file reference type is not a string')
    }

    const releaseObj = release as AppReleaseMeta

    if (releaseObj.type === 'single') {
      isValidAppReleaseMeta(releaseObj)
    } else if (releaseObj.type === 'multi') {
      releaseObj.releases.map((release) => {
        isValidAppReleaseMeta(release)
      })
    } else {
      throw new Error('[isValidAppReleaseFile] Release file reference type is not valid')
    }
  })
}

export const isValidAppReleaseMeta: (
  release: AppReleaseMeta | AppReleaseSingleMeta
) => asserts release is AppReleaseMeta = (release) => {
  if (!release) {
    throw new Error('[isValidAppReleaseMeta] Invalid release')
  }
  if (typeof release !== 'object') {
    throw new Error('[isValidAppReleaseMeta] Release is not an object')
  }

  const releaseObject = release as AppReleaseMeta

  if (!('id' in releaseObject) || typeof releaseObject.id !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release id must be a string')
  }
  if (!('version' in releaseObject) || typeof releaseObject.version !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release version must be a string')
  }
  if (releaseObject.type && releaseObject.type == 'multi') {
    releaseObject.releases.map((release) => {
      isValidAppReleaseMeta(release)
    })
    return
  }
  if (releaseObject.type && releaseObject.type == 'external') {
    releaseObject.releases.map((release) => {
      isValidCommunityRelease(release)
    })
    return
  }
  if (!('label' in releaseObject) || typeof releaseObject.label !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release label must be a string')
  }
  if (!('description' in releaseObject) || typeof releaseObject.description !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release description must be a string')
  }
  if (!('author' in releaseObject) || typeof releaseObject.author !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release author must be a string')
  }
  if (!('platforms' in releaseObject) || !Array.isArray(releaseObject.platforms)) {
    throw new Error('[isValidAppReleaseMeta] Release platforms must be an array')
  }
  if (!('homepage' in releaseObject) || typeof releaseObject.homepage !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release homepage must be a string')
  }
  if (!('repository' in releaseObject) || typeof releaseObject.repository !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release repository must be a string')
  }
  if (!('updateUrl' in releaseObject) || typeof releaseObject.updateUrl !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release updateUrl must be a string')
  }
  if (!('tags' in releaseObject) || !Array.isArray(releaseObject.tags)) {
    throw new Error('[isValidAppReleaseMeta] Release tags must be an array')
  }
  if (
    !('requiredVersions' in releaseObject) ||
    typeof releaseObject.requiredVersions !== 'object'
  ) {
    throw new Error('[isValidAppReleaseMeta] Release requiredVersions must be an object')
  }
  if (
    !('server' in releaseObject.requiredVersions) ||
    typeof releaseObject.requiredVersions.server !== 'string'
  ) {
    throw new Error('[isValidAppReleaseMeta] Release requiredVersions.server must be a string')
  }
  if (
    !('client' in releaseObject.requiredVersions) ||
    typeof releaseObject.requiredVersions.client !== 'string'
  ) {
    throw new Error('[isValidAppReleaseMeta] Release requiredVersions.client must be a string')
  }
  if (!('icon' in releaseObject) || typeof releaseObject.icon !== 'string') {
    throw new Error('[isValidAppReleaseMeta] Release icon must be a string')
  }
}

export const isValidCommunityRelease: (
  reference: unknown
) => asserts reference is AppReleaseCommunity = (reference) => {
  if (!reference) {
    throw new Error('[isValidCommunityRelease] Invalid reference')
  }
  if (typeof reference !== 'object') {
    throw new Error('[isValidCommunityRelease] Reference is not an object')
  }
  if (!('version' in reference)) {
    throw new Error('[isValidCommunityRelease] Reference does not have a version')
  }
  if (!('homepage' in reference)) {
    throw new Error('[isValidCommunityRelease] Reference does not have a homepage')
  }
  if (!('added' in reference)) {
    throw new Error('[isValidCommunityRelease] Reference does not have an added property')
  }
  if (!('author' in reference)) {
    throw new Error('[isValidCommunityRelease] Reference does not have an author')
  }
  if (!('repository' in reference)) {
    throw new Error('[isValidCommunityRelease] Reference does not have a repository')
  }
  if (typeof reference.version !== 'string') {
    throw new Error('[isValidCommunityRelease] Version must be a string')
  }
  if (typeof reference.homepage !== 'string') {
    throw new Error('[isValidCommunityRelease] Homepage must be a string')
  }
  if (typeof reference.added !== 'boolean') {
    throw new Error('[isValidCommunityRelease] Added must be a boolean')
  }
  if (typeof reference.author !== 'string') {
    throw new Error('[isValidCommunityRelease] Author must be a string')
  }
  if (typeof reference.repository !== 'string') {
    throw new Error('[isValidCommunityRelease] Repository must be a string')
  }
  if ('icon' in reference && typeof reference.icon !== 'string') {
    throw new Error('[isValidCommunityRelease] Icon must be a string when provided')
  }
}

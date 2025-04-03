import { DeskThingProfile } from '@deskthing/types'
import { StoreInterface } from '../interfaces/storeInterface'

export enum ProfileStoreEvent {
  PROFILES_LOADED = 'profiles-loaded',
  PROFILE_CREATED = 'profile-created',
  PROFILE_UPDATED = 'profile-updated',
  PROFILE_DELETED = 'profile-deleted',
  ACTIVE_PROFILE_CHANGED = 'active-profile-changed',
  CLIENT_VIEW_CHANGED = 'client-view-changed'
}

export interface ProfileStoreEvents {
  [ProfileStoreEvent.PROFILES_LOADED]: [DeskThingProfile[]]
  [ProfileStoreEvent.PROFILE_CREATED]: [DeskThingProfile]
  [ProfileStoreEvent.PROFILE_UPDATED]: [DeskThingProfile]
  [ProfileStoreEvent.PROFILE_DELETED]: [string]
  [ProfileStoreEvent.ACTIVE_PROFILE_CHANGED]: [DeskThingProfile | null]
  [ProfileStoreEvent.CLIENT_VIEW_CHANGED]: [
    {
      clientId: string
      currentApp: string
      previousApp: string
    }
  ]
}

export interface ProfileStoreClass extends StoreInterface {
  /**
   * Gets all available profiles
   */
  getProfiles(): Promise<DeskThingProfile[]>

  /**
   * Gets a profile by its ID
   * @param profileId ID of the profile to retrieve
   */
  getProfileById(profileId: string): Promise<DeskThingProfile | null>

  /**
   * Gets the currently active profile
   */
  getActiveProfile(): Promise<DeskThingProfile | undefined>

  /**
   * Creates a new profile
   * @param profile Profile data to create
   */
  createProfile(profile: Partial<DeskThingProfile>): Promise<DeskThingProfile>

  /**
   * Updates an existing profile
   * @param profileId ID of the profile to update
   * @param updates Partial profile data to update
   */
  updateProfile(
    profileId: string,
    updates: Partial<DeskThingProfile>
  ): Promise<DeskThingProfile | null>

  /**
   * Deletes a profile
   * @param profileId ID of the profile to delete
   */
  deleteProfile(profileId: string): Promise<boolean>

  /**
   * Applies the active profile to a specific client
   * @param clientId ID of the client to apply the profile to
   */
  applyProfileToClient(clientId: string): Promise<boolean>

  /**
   * Clears the profile cache
   */
  clearCache(): Promise<void>

  /**
   * Saves profiles to file
   */
  saveToFile(): Promise<void>
}
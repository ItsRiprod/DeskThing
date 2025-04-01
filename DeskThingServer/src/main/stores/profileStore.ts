import { DeskThingProfile } from '@deskthing/types'
import {
  ProfileStoreClass,
  ProfileStoreEvent,
  ProfileStoreEvents
} from '@shared/stores/profileStore'
import { CacheableStore } from '@shared/types'
import EventEmitter from 'node:events'
import { readFromFile, writeToFile } from '@server/services/files/fileService'
import logger from '@server/utils/logger'
import { PlatformStoreClass, PlatformStoreEvent } from '@shared/stores/platformStore'
import { DESKTHING_DEVICE, DEVICE_DESKTHING } from '@deskthing/types'
import { v4 as uuidv4 } from 'uuid'
import { join } from 'path'

const PROFILES_FILE_PATH = 'profiles/profiles.json'
const ACTIVE_PROFILE_FILE_PATH = 'profiles/active-profile.json'

interface ProfilesData {
  profiles: DeskThingProfile[]
  activeProfileId?: string
}

export class ProfileStore
  extends EventEmitter<ProfileStoreEvents>
  implements CacheableStore, ProfileStoreClass
{
  private _profiles: DeskThingProfile[] = []
  private _activeProfile: DeskThingProfile | null = null
  private _initialized: boolean = false
  private platformStore: PlatformStoreClass

  public get initialized(): boolean {
    return this._initialized
  }

  constructor(platformStore: PlatformStoreClass) {
    super()
    this.platformStore = platformStore
  }

  async initialize(): Promise<void> {
    if (this._initialized) return

    // Load profiles from storage
    await this.loadFromFile()

    // Set up listeners for client events
    this.setupClientListeners()

    this._initialized = true

    logger.info('Profile store initialized', {
      function: 'initialize',
      source: 'profileStore'
    })
  }

  private setupClientListeners(): void {
    // Listen for client view changes
    this.platformStore.on(PlatformStoreEvent.DATA_RECEIVED, async (eventData) => {
      try {
        const { client, data } = eventData
        if (data.type === DEVICE_DESKTHING.VIEW && data.request === 'change') {
          logger.debug(`Client ${client.connectionId} changed view to ${data.payload.currentApp}`, {
            function: 'handleViewChange',
            source: 'profileStore'
          })

          // You could trigger profile changes based on app changes if needed
          this.emit(ProfileStoreEvent.CLIENT_VIEW_CHANGED, {
            clientId: client.connectionId,
            currentApp: data.payload.currentApp,
            previousApp: data.payload.previousApp
          })
        }

        // Listen for client configuration updates
        if (data.type === DEVICE_DESKTHING.CONFIG && data.request === 'set') {
          logger.debug(`Client ${client.connectionId} updated configuration`, {
            function: 'handleConfigUpdate',
            source: 'profileStore'
          })

          if (this._activeProfile) {
            // Update the active profile with the new client configuration
            this._activeProfile.clientConfig = data.payload
            this.saveToFile()
            this.emit(ProfileStoreEvent.PROFILE_UPDATED, this._activeProfile)
          }
        }

        if (data.type === DEVICE_DESKTHING.CONFIG && data.request === 'get') {
          this.applyProfileToClient(client.connectionId)
        }
      } catch (error) {
        logger.error('Error handling client data', {
          error: error as Error,
          function: 'handleClientData',
          source: 'profileStore'
        })
      }
    })
  }

  public clearCache = async (): Promise<void> => {
    this._profiles = []
    this._activeProfile = null
  }

  public saveToFile = async (): Promise<void> => {
    try {
      const profilesData: ProfilesData = {
        profiles: this._profiles,
        activeProfileId: this._activeProfile?.id
      }

      await writeToFile(profilesData, PROFILES_FILE_PATH)

      if (this._activeProfile) {
        await writeToFile(this._activeProfile, ACTIVE_PROFILE_FILE_PATH)
      }

      logger.debug('Saved profiles to file', {
        function: 'saveToFile',
        source: 'profileStore'
      })
    } catch (error) {
      logger.error('Failed to save profiles to file', {
        error: error as Error,
        function: 'saveToFile',
        source: 'profileStore'
      })
    }
  }

  private async loadFromFile(): Promise<void> {
    try {
      const profilesData = await readFromFile<ProfilesData>(PROFILES_FILE_PATH)

      if (profilesData) {
        this._profiles = profilesData.profiles || []

        // Load active profile
        if (profilesData.activeProfileId) {
          this._activeProfile =
            this._profiles.find((p) => p.id === profilesData.activeProfileId) || null
        }

        logger.debug(`Loaded ${this._profiles.length} profiles from file`, {
          function: 'loadFromFile',
          source: 'profileStore'
        })

        this.emit(ProfileStoreEvent.PROFILES_LOADED, this._profiles)
        if (this._activeProfile) {
          this.emit(ProfileStoreEvent.ACTIVE_PROFILE_CHANGED, this._activeProfile)
        }
      } else {
        // Initialize with empty data
        this._profiles = []
        this._activeProfile = null
      }
    } catch (error) {
      logger.error('Failed to load profiles from file', {
        error: error as Error,
        function: 'loadFromFile',
        source: 'profileStore'
      })

      // Initialize with empty data on error
      this._profiles = []
      this._activeProfile = null
    }
  }

  async getProfiles(): Promise<DeskThingProfile[]> {
    return this._profiles
  }

  async getProfileById(profileId: string): Promise<DeskThingProfile | null> {
    return this._profiles.find((profile) => profile.id === profileId) || null
  }

  async getActiveProfile(): Promise<DeskThingProfile | null> {
    return this._activeProfile
  }

  async createProfile(profile: Partial<DeskThingProfile>): Promise<DeskThingProfile> {
    const newProfile: DeskThingProfile = {
      id: profile.id || uuidv4(),
      version: profile.version || '1.0.0',
      created: profile.created || new Date(),
      enabled: profile.enabled !== undefined ? profile.enabled : true,
      ...profile
    }

    this._profiles.push(newProfile)
    await this.saveToFile()

    this.emit(ProfileStoreEvent.PROFILE_CREATED, newProfile)
    logger.info(`Created new profile: ${newProfile.id}`, {
      function: 'createProfile',
      source: 'profileStore'
    })

    return newProfile
  }

  async updateProfile(
    profileId: string,
    updates: Partial<DeskThingProfile>
  ): Promise<DeskThingProfile | null> {
    const profileIndex = this._profiles.findIndex((p) => p.id === profileId)

    if (profileIndex === -1) {
      logger.warn(`Profile not found: ${profileId}`, {
        function: 'updateProfile',
        source: 'profileStore'
      })
      return null
    }

    const updatedProfile = {
      ...this._profiles[profileIndex],
      ...updates
    }

    this._profiles[profileIndex] = updatedProfile

    // If we're updating the active profile, update that reference too
    if (this._activeProfile && this._activeProfile.id === profileId) {
      this._activeProfile = updatedProfile
    }

    await this.saveToFile()

    this.emit(ProfileStoreEvent.PROFILE_UPDATED, updatedProfile)
    logger.info(`Updated profile: ${profileId}`, {
      function: 'updateProfile',
      source: 'profileStore'
    })

    return updatedProfile
  }

  async deleteProfile(profileId: string): Promise<boolean> {
    const profileIndex = this._profiles.findIndex((p) => p.id === profileId)

    if (profileIndex === -1) {
      logger.warn(`Profile not found for deletion: ${profileId}`, {
        function: 'deleteProfile',
        source: 'profileStore'
      })
      return false
    }

    // If deleting the active profile, clear it
    if (this._activeProfile && this._activeProfile.id === profileId) {
      this._activeProfile = null
    }

    this._profiles.splice(profileIndex, 1)
    await this.saveToFile()

    this.emit(ProfileStoreEvent.PROFILE_DELETED, profileId)
    logger.info(`Deleted profile: ${profileId}`, {
      function: 'deleteProfile',
      source: 'profileStore'
    })

    return true
  }

  async setActiveProfile(profileId: string): Promise<DeskThingProfile | null> {
    const profile = this._profiles.find((p) => p.id === profileId)

    if (!profile) {
      logger.warn(`Profile not found for activation: ${profileId}`, {
        function: 'setActiveProfile',
        source: 'profileStore'
      })
      return null
    }

    this._activeProfile = profile
    await this.saveToFile()

    // Apply this profile to all connected clients
    this.applyProfileToAllClients()

    this.emit(ProfileStoreEvent.ACTIVE_PROFILE_CHANGED, profile)
    logger.info(`Set active profile: ${profileId}`, {
      function: 'setActiveProfile',
      source: 'profileStore'
    })

    return profile
  }

  async clearActiveProfile(): Promise<void> {
    this._activeProfile = null
    await this.saveToFile()

    this.emit(ProfileStoreEvent.ACTIVE_PROFILE_CHANGED, null)
    logger.info('Cleared active profile', {
      function: 'clearActiveProfile',
      source: 'profileStore'
    })
  }

  private async applyProfileToAllClients(): Promise<void> {
    if (!this._activeProfile || !this._activeProfile.clientConfig) {
      logger.debug('No active profile or client config to apply', {
        function: 'applyProfileToAllClients',
        source: 'profileStore'
      })
      return
    }

    const clients = this.platformStore.getClients()

    for (const client of clients) {
      await this.applyProfileToClient(client.connectionId)
    }

    logger.info(`Applied active profile to ${clients.length} clients`, {
      function: 'applyProfileToAllClients',
      source: 'profileStore'
    })
  }

  async applyProfileToClient(clientId: string): Promise<boolean> {
    if (!this._activeProfile || !this._activeProfile.clientConfig) {
      logger.debug(`No active profile or client config to apply to client ${clientId}`, {
        function: 'applyProfileToClient',
        source: 'profileStore'
      })
      return false
    }

    try {
      // Send client configuration
      await this.platformStore.sendDataToClient({
        app: 'client',
        clientId,
        type: DESKTHING_DEVICE.CONFIG,
        request: 'set',
        payload: this._activeProfile.clientConfig
      })

      // If the profile has mapping information, send that too
      if (this._activeProfile.mapping) {
        await this.platformStore.sendDataToClient({
          app: 'client',
          clientId,
          type: DESKTHING_DEVICE.MAPPINGS,
          payload: this._activeProfile.mapping
        })
      }

      logger.info(`Applied profile ${this._activeProfile.id} to client ${clientId}`, {
        function: 'applyProfileToClient',
        source: 'profileStore'
      })

      return true
    } catch (error) {
      logger.error(`Failed to apply profile to client ${clientId}`, {
        error: error as Error,
        function: 'applyProfileToClient',
        source: 'profileStore'
      })
      return false
    }
  }

  // Additional utility methods

  async duplicateProfile(profileId: string, newName?: string): Promise<DeskThingProfile | null> {
    const sourceProfile = await this.getProfileById(profileId)

    if (!sourceProfile) {
      logger.warn(`Profile not found for duplication: ${profileId}`, {
        function: 'duplicateProfile',
        source: 'profileStore'
      })
      return null
    }

    const duplicatedProfile: DeskThingProfile = {
      ...sourceProfile,
      id: uuidv4(),
      created: new Date(),
      label: newName || `${sourceProfile.label || 'Profile'} (Copy)`
    }

    this._profiles.push(duplicatedProfile)
    await this.saveToFile()

    this.emit(ProfileStoreEvent.PROFILE_CREATED, duplicatedProfile)
    logger.info(`Duplicated profile ${profileId} to ${duplicatedProfile.id}`, {
      function: 'duplicateProfile',
      source: 'profileStore'
    })

    return duplicatedProfile
  }

  async exportProfile(profileId: string, filePath?: string): Promise<string | null> {
    const profile = await this.getProfileById(profileId)

    if (!profile) {
      logger.warn(`Profile not found for export: ${profileId}`, {
        function: 'exportProfile',
        source: 'profileStore'
      })
      return null
    }

    try {
      const exportPath = filePath || join('profiles', 'exports', `${profile.id}-${Date.now()}.json`)
      await writeToFile(profile, exportPath)

      logger.info(`Exported profile ${profileId} to ${exportPath}`, {
        function: 'exportProfile',
        source: 'profileStore'
      })

      return exportPath
    } catch (error) {
      logger.error(`Failed to export profile ${profileId}`, {
        error: error as Error,
        function: 'exportProfile',
        source: 'profileStore'
      })
      return null
    }
  }

  async importProfile(filePath: string): Promise<DeskThingProfile | null> {
    try {
      const importedProfile = await readFromFile<DeskThingProfile>(filePath)

      if (!importedProfile || !importedProfile.id) {
        logger.warn(`Invalid profile data in file: ${filePath}`, {
          function: 'importProfile',
          source: 'profileStore'
        })
        return null
      }

      // Generate a new ID to avoid conflicts
      const newProfile: DeskThingProfile = {
        ...importedProfile,
        id: uuidv4(),
        created: new Date(),
        label: `${importedProfile.label || 'Imported Profile'}`
      }

      this._profiles.push(newProfile)
      await this.saveToFile()

      this.emit(ProfileStoreEvent.PROFILE_CREATED, newProfile)
      logger.info(`Imported profile from ${filePath}`, {
        function: 'importProfile',
        source: 'profileStore'
      })

      return newProfile
    } catch (error) {
      logger.error(`Failed to import profile from ${filePath}`, {
        error: error as Error,
        function: 'importProfile',
        source: 'profileStore'
      })
      return null
    }
  }
}

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

const PROFILE_FILE_PATH = 'profiles/profile.json'

export class ProfileStore
  extends EventEmitter<ProfileStoreEvents>
  implements CacheableStore, ProfileStoreClass
{
  private _profile: DeskThingProfile | undefined
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

    await this.loadFromFile()
    this.setupClientListeners()
    this._initialized = true

    logger.info('Profile store initialized', {
      function: 'initialize',
      source: 'profileStore'
    })
  }

  private setupClientListeners(): void {
    this.platformStore.on(PlatformStoreEvent.DATA_RECEIVED, async (eventData) => {
      try {
        const { client, data } = eventData
        if (data.type === DEVICE_DESKTHING.VIEW && data.request === 'change') {
          logger.debug(`Client ${client.clientId} changed view to ${data.payload.currentApp}`, {
            function: 'handleViewChange',
            source: 'profileStore'
          })

          this.emit(ProfileStoreEvent.CLIENT_VIEW_CHANGED, {
            clientId: client.clientId,
            currentApp: data.payload.currentApp,
            previousApp: data.payload.previousApp
          })
        }

        if (data.type === DEVICE_DESKTHING.CONFIG && data.request === 'set') {
          logger.debug(`Client ${client.clientId} updated configuration`, {
            function: 'handleConfigUpdate',
            source: 'profileStore'
          })

          if (this._profile) {
            this._profile.clientConfig = data.payload
            this.saveToFile()
            this.emit(ProfileStoreEvent.PROFILE_UPDATED, this._profile)
          }
        }

        if (data.type === DEVICE_DESKTHING.CONFIG && data.request === 'get') {
          this.applyProfileToClient(client.clientId)
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
    this._profile = undefined
  }

  public saveToFile = async (): Promise<void> => {
    try {
      if (this._profile) {
        await writeToFile(this._profile, PROFILE_FILE_PATH)
        logger.debug('Saved profile to file', {
          function: 'saveToFile',
          source: 'profileStore'
        })
      }
    } catch (error) {
      logger.error('Failed to save profile to file', {
        error: error as Error,
        function: 'saveToFile',
        source: 'profileStore'
      })
    }
  }

  private async loadFromFile(): Promise<void> {
    try {
      this._profile = await readFromFile<DeskThingProfile>(PROFILE_FILE_PATH)

      if (this._profile) {
        logger.debug('Loaded profile from file', {
          function: 'loadFromFile',
          source: 'profileStore'
        })
        this.emit(ProfileStoreEvent.PROFILES_LOADED, [this._profile])
        this.emit(ProfileStoreEvent.ACTIVE_PROFILE_CHANGED, this._profile)
      }
    } catch (error) {
      logger.error('Failed to load profile from file', {
        error: error as Error,
        function: 'loadFromFile',
        source: 'profileStore'
      })
      this._profile = undefined
    }
  }

  async getProfiles(): Promise<DeskThingProfile[]> {
    return this._profile ? [this._profile] : []
  }

  async getProfileById(profileId: string): Promise<DeskThingProfile | null> {
    return this._profile?.id === profileId ? this._profile : null
  }

  async getActiveProfile(): Promise<DeskThingProfile | undefined> {
    return this._profile
  }

  async createProfile(profile: Partial<DeskThingProfile>): Promise<DeskThingProfile> {
    const newProfile: DeskThingProfile = {
      id: uuidv4(),
      version: profile.version || '1.0.0',
      created: new Date(),
      enabled: true,
      ...profile
    }

    this._profile = newProfile
    await this.saveToFile()

    this.emit(ProfileStoreEvent.PROFILE_CREATED, newProfile)
    this.emit(ProfileStoreEvent.ACTIVE_PROFILE_CHANGED, newProfile)
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
    if (!this._profile || this._profile.id !== profileId) {
      return null
    }

    this._profile = {
      ...this._profile,
      ...updates
    }

    await this.saveToFile()
    this.emit(ProfileStoreEvent.PROFILE_UPDATED, this._profile)

    return this._profile
  }

  async deleteProfile(): Promise<boolean> {
    this._profile = undefined
    await this.saveToFile()
    return true
  }

  private async applyProfileToAllClients(): Promise<void> {
    if (!this._profile || !this._profile.clientConfig) {
      return
    }

    const clients = this.platformStore.getClients()
    for (const client of clients) {
      await this.applyProfileToClient(client.clientId)
    }
  }

  async applyProfileToClient(clientId: string): Promise<boolean> {
    if (!this._profile || !this._profile.clientConfig) {
      return false
    }

    try {
      await this.platformStore.sendDataToClient({
        app: 'client',
        clientId,
        type: DESKTHING_DEVICE.CONFIG,
        request: 'set',
        payload: this._profile.clientConfig
      })

      if (this._profile.mapping) {
        await this.platformStore.sendDataToClient({
          app: 'client',
          clientId,
          type: DESKTHING_DEVICE.MAPPINGS,
          payload: this._profile.mapping
        })
      }

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
}

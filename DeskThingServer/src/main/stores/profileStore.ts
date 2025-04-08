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
import defaultProfile from '@server/static/defaultProfile'
import { storeProvider } from './storeProvider'
import { defaultMappingProfile } from '@server/static/defaultButtons'

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

          this.updateProfile({ clientConfig: data.payload })
        }

        if (data.type === DEVICE_DESKTHING.CONFIG && data.request === 'get') {
          logger.debug(`Client ${client.clientId} requested server configuration`, {
            function: 'handleConfigUpdate',
            source: 'profileStore'
          })
          await this.applyProfileToClient(client.clientId)
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
      const profile = await this.getActiveProfile()
      if (profile) {
        await writeToFile(profile, PROFILE_FILE_PATH)
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

      if (!this._profile) {
        this._profile = defaultProfile
        logger.debug('No profile loaded. Loading Default', {
          function: 'loadFromFile',
          source: 'profileStore'
        })
      }

      logger.debug('Loaded profile from file', {
        function: 'loadFromFile',
        source: 'profileStore'
      })
      this.emit(ProfileStoreEvent.PROFILES_LOADED, [this._profile])
      this.emit(ProfileStoreEvent.ACTIVE_PROFILE_CHANGED, this._profile)
    } catch (error) {
      logger.error('Failed to load profile from file', {
        error: error as Error,
        function: 'loadFromFile',
        source: 'profileStore'
      })
      this._profile = defaultProfile
    }
  }

  async getActiveProfile(): Promise<DeskThingProfile | undefined> {
    if (!this._profile) {
      logger.debug('No profile loaded. Loading Default')
      await this.loadFromFile()
    }
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

    this.setProfile(newProfile)

    this.emit(ProfileStoreEvent.PROFILE_CREATED, newProfile)

    return newProfile
  }

  setProfile = async (profile: DeskThingProfile): Promise<void> => {
    this._profile = profile

    this.emit(ProfileStoreEvent.ACTIVE_PROFILE_CHANGED, profile)
    logger.info(`Created new profile: ${profile.id}`, {
      function: 'createProfile',
      source: 'profileStore'
    })
  }

  async updateProfile(
    updates: Partial<DeskThingProfile>,
    profileId?: string
  ): Promise<DeskThingProfile | null> {
    const profile = await this.getActiveProfile()

    if (!profile || (profile.id !== profileId && profileId)) {
      return null
    }

    const newProfile = {
      ...profile,
      ...updates
    }

    this._profile = newProfile

    await this.saveToFile()
    this.emit(ProfileStoreEvent.PROFILE_UPDATED, newProfile)

    return newProfile
  }

  async deleteProfile(): Promise<boolean> {
    this._profile = undefined
    await this.saveToFile()
    return true
  }

  async applyProfileToClient(clientId: string): Promise<boolean> {
    const profile = await this.getActiveProfile()

    if (!profile) {
      logger.debug('No profile found!')
      return false
    }
    logger.debug(`Setting ${clientId}'s config to ${profile.id} because it was requested`)

    try {
      if (profile.clientConfig) {
        await this.platformStore.sendDataToClient({
          app: 'client',
          clientId,
          type: DESKTHING_DEVICE.CONFIG,
          request: 'set',
          payload: profile.clientConfig
        })
      }

      // Rework in the Profile update. Currently just a hotfix legacy connector
      const mappingStore = await storeProvider.getStore('mappingStore')

      const mapping = await mappingStore.getMapping()

      if (profile && mapping) {
        if (!profile.mapping) {
          profile.mapping = defaultMappingProfile
        }

        profile.mapping.mapping = mapping.mapping
        profile.mapping.actions = await mappingStore.getActions()
        profile.mapping.keys = await mappingStore.getKeys()
        profile.mapping.profileId = (await mappingStore.getCurrentProfile()).id

        await this.platformStore.sendDataToClient({
          app: 'client',
          clientId,
          type: DESKTHING_DEVICE.MAPPINGS,
          payload: profile.mapping
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

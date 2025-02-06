console.log('[MapFile Service] Starting')
import {
  ButtonMapping,
  MappingFileStructure,
  MappingStructure,
  MESSAGE_TYPES,
  Profile
} from '@shared/types'
import Logger from '@server/utils/logger'
import { readFromFile, writeToFile } from '@server/utils/fileHandler'
import { defaultData } from '@server/static/defaultMapping'
import { isValidButtonMapping, isValidFileStructure, isValidMappingStructure } from './utilsMaps'
import path from 'path'

/**
 * Loads the mapping data from a file and validates it. If the file is corrupt or missing, it will use the default mapping data and save it to the file.
 * @returns {Promise<MappingStructure>} The validated mapping data.
 */
export const loadMappings = async (): Promise<MappingStructure> => {
  const data = await readFromFile<MappingFileStructure>(path.join('mappings', 'mappings.json'))
  if (!data || data?.version !== defaultData.version) {
    Logger.error(`Mappings file is corrupt or does not exist, using default`, {
      error: new Error('Version not found or data is null'),
      function: 'loadMappings',
      source: 'FileHandler'
    })
    await saveMappings(defaultData)
    return defaultData
  }

  try {
    isValidFileStructure(data)
  } catch (error) {
    Logger.error(`Mappings file is corrupt or does not exist, using default`, {
      error: error as Error,
      function: 'loadMappings',
      source: 'FileHandler'
    })
    await saveMappings(defaultData)
    return defaultData
  }

  const parsedData = await fetchProfiles(data)

  try {
    await isValidMappingStructure(parsedData)
  } catch (error) {
    Logger.error(`Mappings file is corrupt, resetting to default`, {
      error: error as Error,
      function: 'loadMappings',
      source: 'FileHandler'
    })
    await saveMappings(defaultData)
    return defaultData
  }
  return parsedData
}
/**
 * Fetches and validates the mapping profiles from the file data.
 * @param {MappingFileStructure} fileData - The mapping file data to fetch the profiles from.
 * @returns {Promise<MappingStructure>} The validated mapping structure, including the fetched profiles.
 */
const fetchProfiles = async (fileData: MappingFileStructure): Promise<MappingStructure> => {
  // Map through each profile file and load its data
  const profiles = await Promise.all(
    fileData.profiles.map(async (profile) => {
      // Read the profile data from the mappings directory
      const data = await readFromFile<ButtonMapping>(path.join('mappings', `${profile.id}.json`))
      if (data && isValidButtonMapping(data)) {
        // Return profile data in key-value format
        return { [profile.id]: data }
      } else {
        Logger.warn(`Unable to fetch profile`, {
          error: new Error(`Failed to fetch profile ${profile.id}`),
          function: 'fetchProfiles',
          source: 'FileHandler'
        })
        // Return null for failed profile loads
        return null
      }
    })
  )

  // Filter out any null values from failed profile loads
  const validProfiles = profiles.filter((profile) => profile !== null)

  // Construct the final mapping structure
  const mappingStructure: MappingStructure = {
    ...fileData, // Spread the original file data
    profiles: Object.assign({}, ...validProfiles) // Merge all valid profile data
  }

  return mappingStructure
}

/**
 * Saves the mapping profiles to individual JSON files in the 'mappings' directory.
 * @param {MappingStructure} mappingData - The mapping data to save.
 * @returns {Promise<MappingFileStructure>} The updated mapping file structure, including the saved profiles.
 */
const saveProfiles = async (mappingData: MappingStructure): Promise<MappingFileStructure> => {
  const profiles: Profile[] = await Promise.all(
    Object.values(mappingData.profiles).map(async (profile) => {
      try {
        // Save each profile to a .json file named after its id (e.g. 'default' -> 'default.json')
        console.log('Writing map: ', profile.id, ' to file')
        await writeToFile<ButtonMapping>(profile, path.join('mappings', `${profile.id}.json`))
        return { ...profile, mapping: undefined }
      } catch (error) {
        Logger.warn('failed to save profile', {
          error: error as Error,
          function: 'saveProfiles',
          source: 'FileHandler'
        })
        // Return this data regardless
        return { ...profile, mapping: undefined }
      }
    })
  )

  return { ...mappingData, profiles }
}

/**
 * Saves the button mappings to a JSON file.
 * @param {MappingStructure} mapping - The mapping data to save.
 * @returns {Promise<void>} A promise that resolves when the mappings have been saved.
 */
export const saveMappings = async (mapping: MappingStructure): Promise<void> => {
  try {
    await isValidMappingStructure(mapping)
    Logger.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Saving button mapping`)
    const saveData = await saveProfiles(mapping)
    await writeToFile(saveData, path.join('mappings', 'mappings.json'))
  } catch (error) {
    Logger.warn('Unable to save mappings. Something is corrupted. Resetting to default', {
      error: error as Error,
      function: 'saveMappings',
      source: 'fileMaps'
    })
    const saveData = await saveProfiles(defaultData)
    try {
      await writeToFile(saveData, path.join('mappings', 'mappings.json'))
    } catch (error) {
      Logger.warn('Failed to save mappings', {
        error: error as Error,
        function: 'saveMappings',
        source: 'fileMaps'
      })
    }
  }
}
/**
 * Exports a button mapping profile to a file.
 * @param {ButtonMapping} profile - The button mapping profile to export.
 * @param {string} filePath - The file path to save the profile to.
 * @returns {Promise<void>} A promise that resolves when the profile has been exported.
 */
export const exportProfile = async (profile: ButtonMapping, filePath: string): Promise<void> => {
  try {
    await writeToFile<ButtonMapping>(profile, filePath)
    Logger.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Profile ${profile} exported to ${filePath}`)
  } catch (error) {
    Logger.error('Failed to export profile', {
      error: error as Error,
      function: 'exportProfile',
      source: 'FileHandler'
    })
  }
}

/**
 * Imports a button mapping profile from a file.
 * @param {string} filePath - The file path to load the profile from.
 * @param {string} profileName - The name of the profile to import.
 * @returns {Promise<ButtonMapping | void>} The imported button mapping profile, or `void` if the import failed.
 */
export const importProfile = async (
  filePath: string,
  profileName: string
): Promise<ButtonMapping | void> => {
  // Load profile data from the file
  try {
    const profileData = await readFromFile<ButtonMapping>(filePath)

    if (!profileData) {
      Logger.error(`MAPHANDLER: Failed to load profile data from ${filePath}`, {
        function: 'importProfile',
        source: 'fileMaps',
        domain: 'server'
      })
      return
    }

    try {
      isValidButtonMapping(profileData)
    } catch (error) {
      Logger.error(`MAPHANDLER: Invalid profile data in file ${filePath}`, {
        function: 'importProfile',
        source: 'fileMaps',
        domain: 'server',
        error: error as Error
      })
      return
    }

    Logger.info(`MAPHANDLER: Profile ${profileName} imported from ${filePath}`, {
      function: 'importProfile',
      source: 'fileMaps',
      domain: 'server'
    })

    return profileData
  } catch (error) {
    Logger.error(`Unable to import profile from ${filePath}`, {
      error: error as Error,
      function: 'importProfile',
      source: 'fileMaps',
      domain: 'server'
    })
  }
}

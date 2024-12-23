console.log('[MapFile Service] Starting')
import {
  ButtonMapping,
  MappingFileStructure,
  MappingStructure,
  MESSAGE_TYPES,
  Profile
} from '@shared/types'
import { loggingStore } from '@server/stores/'
import {
  readFromFile,
  readFromGlobalFile,
  writeToFile,
  writeToGlobalFile
} from '@server/utils/fileHandler'
import { defaultData } from '@server/static/defaultMapping'
import { isValidButtonMapping, isValidFileStructure, isValidMappingStructure } from './utilsMaps'
import path from 'path'

/**
 * Loads the mapping data from a file and validates it. If the file is corrupt or missing, it will use the default mapping data and save it to the file.
 * @returns {Promise<MappingStructure>} The validated mapping data.
 */
export const loadMappings = async (): Promise<MappingStructure> => {
  const data = readFromFile<MappingFileStructure>(path.join('mappings', 'mappings.json'))
  if (!data || data?.version !== defaultData.version) {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Mappings file is corrupt or does not exist, using default`
    )
    saveMappings(defaultData)
    return defaultData
  }

  if (!isValidFileStructure(data)) {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Mappings file is corrupt or does not exist, using default`
    )
    saveMappings(defaultData)
    return defaultData
  }

  const parsedData = await fetchProfiles(data)

  if (!(await isValidMappingStructure(parsedData))) {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Mappings file is corrupt, resetting to default`
    )
    saveMappings(defaultData)
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
        loggingStore.log(
          MESSAGE_TYPES.WARNING,
          `FILEMAPS: Unable to fetch profile of ${profile.id}!`
        )
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
        writeToFile<ButtonMapping>(profile, path.join('mappings', `${profile.id}.json`))
        return { ...profile, mapping: undefined }
      } catch (error) {
        if (error instanceof Error) {
          loggingStore.log(MESSAGE_TYPES.WARNING, '[saveProfiles] failed with ' + error.message)
        } else {
          console.error(error)
          loggingStore.log(
            MESSAGE_TYPES.ERROR,
            '[saveProfiles] failed in an unknown way. Please consult the log for full error'
          )
        }
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
  const isValidMapping = await isValidMappingStructure(mapping)
  let saveData: MappingFileStructure | undefined
  if (isValidMapping) {
    loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Saving button mapping`)
    saveData = await saveProfiles(mapping)
  } else {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Unable to save mappings. Something is corrupted. Resetting to default`
    )
    saveData = await saveProfiles(defaultData)
  }
  try {
    writeToFile(saveData, path.join('mappings', 'mappings.json'))
  } catch (error) {
    if (error instanceof Error) {
      loggingStore.log(MESSAGE_TYPES.WARNING, '[saveMappings] failed with ' + error.message)
    } else {
      loggingStore.log(
        MESSAGE_TYPES.WARNING,
        '[saveMappings] failed with unknown error. See extended logs for details'
      )
      console.log(error)
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
  writeToGlobalFile<ButtonMapping>(profile, filePath)

  loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Profile ${profile} exported to ${filePath}`)
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
  const profileData = readFromGlobalFile<ButtonMapping>(filePath)

  if (!profileData) {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Failed to load profile data from ${filePath}`
    )
    return
  }

  if (!isValidButtonMapping(profileData)) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Invalid profile data in file ${filePath}`)
    return
  }

  loggingStore.log(
    MESSAGE_TYPES.LOGGING,
    `MAPHANDLER: Profile ${profileName} imported from ${filePath}`
  )

  return profileData
}

import { ButtonMapping, MappingFileStructure, MappingStructure, MESSAGE_TYPES } from '@shared/types'
import loggingStore from '@server/stores/loggingStore'
import {
  readFromFile,
  readFromGlobalFile,
  writeToFile,
  writeToGlobalFile
} from '@server/utils/fileHandler'
import { defaultData } from '@server/static/defaultMapping'
import { isValidButtonMapping, isValidFileStructure } from './utilsMaps'
import path from 'path'

// Loads the mapping from the file
export const loadMappings = async (): Promise<MappingStructure> => {
  const data = readFromFile<MappingFileStructure>(path.join('mappings', 'mappings.json'))
  if (!data || data?.version !== defaultData.version) {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Mappings file is corrupt or does not exist, using default`
    )
    writeToFile(defaultData, 'mappings.json')
    return defaultData
  }

  const parsedData = await fetchProfiles(data)

  if (!isValidFileStructure(parsedData)) {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Mappings file is corrupt, resetting to default`
    )
    writeToFile(defaultData, 'mappings.json')
    return defaultData
  }
  return parsedData
}

// Fetches and processes profile data from mapping files
const fetchProfiles = async (fileData: MappingFileStructure): Promise<MappingStructure> => {
  // Map through each profile file and load its data
  const profiles = await Promise.all(
    Object.keys(fileData.profiles).map(async (profile) => {
      // Read the profile data from the mappings directory
      const data = await readFromFile<ButtonMapping>(path.join('mappings', `${profile}.json`))
      if (data) {
        // Return profile data in key-value format
        return { [profile]: data }
      } else {
        loggingStore.log(MESSAGE_TYPES.WARNING, `FILEMAPS: Unable to fetch profile of ${profile}!`)
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

const saveProfiles = async (mappingData: MappingStructure): Promise<void> => {
  await Promise.all(
    Object.values(mappingData.profiles).map(async (profile) => {
      // Save each profile to a .json file named after its id (e.g. 'default' -> 'default.json')
      await writeToFile<ButtonMapping>(profile, path.join('mappings', `${profile.id}.json`))
    })
  )
}

// Saves the mapping
export const saveMappings = async (mapping: MappingStructure): Promise<void> => {
  if (!isValidFileStructure(mapping)) {
    saveProfiles(mapping)
    writeToFile(mapping, 'mappings.json')
  } else {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: New Mappings file is corrupt, resetting to default`
    )
    writeToFile(defaultData, 'mappings.json')
  }
}

export const exportProfile = async (profile: ButtonMapping, filePath: string): Promise<void> => {
  writeToGlobalFile<ButtonMapping>(profile, filePath)

  loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Profile ${profile} exported to ${filePath}`)
}

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

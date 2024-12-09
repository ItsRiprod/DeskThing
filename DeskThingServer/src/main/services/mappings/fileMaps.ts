console.log('[MapFile Service] Starting')
import {
  ButtonMapping,
  MappingFileStructure,
  MappingStructure,
  MESSAGE_TYPES,
  Profile
} from '@shared/types'
import loggingStore from '@server/stores/loggingStore'
import {
  readFromFile,
  readFromGlobalFile,
  writeToFile,
  writeToGlobalFile
} from '@server/utils/fileHandler'
import { defaultData } from '@server/static/defaultMapping'
import { isValidButtonMapping, isValidFileStructure, isValidMappingStructure } from './utilsMaps'
import path from 'path'

// Loads the mapping from the file
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

// Fetches and processes profile data from mapping files
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

const saveProfiles = async (mappingData: MappingStructure): Promise<MappingFileStructure> => {
  const profiles: Profile[] = await Promise.all(
    Object.values(mappingData.profiles).map(async (profile) => {
      // Save each profile to a .json file named after its id (e.g. 'default' -> 'default.json')
      console.log('Writing map: ', profile.id, ' to file')
      await writeToFile<ButtonMapping>(profile, path.join('mappings', `${profile.id}.json`))
      return { ...profile, mapping: undefined }
    })
  )

  return { ...mappingData, profiles }
}

// Saves the mapping
export const saveMappings = async (mapping: MappingStructure): Promise<void> => {
  const isValidMapping = await isValidMappingStructure(mapping)
  if (isValidMapping) {
    loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Saving button mapping`)
    const saveData = await saveProfiles(mapping)
    writeToFile(saveData, path.join('mappings', 'mappings.json'))
  } else {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `MAPHANDLER: Unable to save mappings. Something is corrupted. Resetting to default`
    )
    const saveData = await saveProfiles(defaultData)
    writeToFile(saveData, path.join('mappings', 'mappings.json'))
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

import { Client } from '@deskthing/types'
import logger from '@server/utils/logger'

export class ClientIdentificationService {
  /**
   * Determines if two clients are likely the same device
   */
  static isSameDevice(clientA: Client, clientB: Client): boolean {
    // If they have the same clientId, they're the same
    if (clientA.clientId === clientB.clientId) return true

    // Check if clientId of one exists in identifiers of another
    if (
      clientA.identifiers &&
      Object.values(clientA.identifiers).some((id) => id.id === clientB.clientId)
    ) {
      logger.debug(
        `Client ${clientA.clientId} has clientId ${clientB.clientId} in its identifiers`,
        {
          domain: 'clientIdentificationService',
          function: 'isSameDevice'
        }
      )
      return true
    }
    if (
      clientB.identifiers &&
      Object.values(clientB.identifiers).some((id) => id.id === clientA.clientId)
    ) {
      logger.debug(
        `Clients ${clientA.clientId} and ${clientB.clientId} are likely the same device`,
        {
          domain: 'clientIdentificationService',
          function: 'isSameDevice'
        }
      )
      return true
    }

    return false
  }
  /**
   * Merges two clients into one, preserving the most recent and complete information
   */
  static mergeClients(primary: Client, secondary: Client): Client {
    // Create a new client object with primary as the base
    const mergedClient: Client = { ...primary }

    // Merge identifiers
    mergedClient.identifiers = {
      ...primary.identifiers,
      ...secondary.identifiers
    }

    // Use the most recent timestamp
    if (primary.connected && secondary.connected && secondary.timestamp > primary.timestamp) {
      mergedClient.timestamp = secondary.timestamp
    }

    // Merge manifest data, preferring the more complete one
    if (secondary.manifest) {
      if (!primary.manifest) {
        mergedClient.manifest = secondary.manifest
      } else {
        // Merge context data from both manifests
        mergedClient.manifest = {
          ...primary.manifest,
          ...secondary.manifest,
          context: {
            ...primary.manifest.context,
            ...secondary.manifest.context
          }
        }
      }
    }

    // Determine primary provider based on capabilities
    if (Object.values(mergedClient.identifiers).length > 0) {
      const providers = Object.values(mergedClient.identifiers).filter((id) => id.active)
      const primaryProvider = providers.sort(
        (a, b) => (b.capabilities?.length || 0) - (a.capabilities?.length || 0)
      )[0]

      if (primaryProvider) {
        mergedClient.connected = true
        mergedClient.connectionState = Math.min(primary.connectionState, secondary.connectionState)
        mergedClient.primaryProviderId = primaryProvider.providerId
      } else {
        mergedClient.connectionState = Math.min(primary.connectionState, secondary.connectionState)
      }
    }

    return mergedClient
  }
}

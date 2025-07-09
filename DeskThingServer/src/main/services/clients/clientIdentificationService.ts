import { Client, ConnectionState } from '@deskthing/types'
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
    const mergedClient: Client = {
      ...primary,
      ...secondary,
      meta: {
        ...primary.meta,
        ...secondary.meta
      },
      identifiers: {
        ...primary.identifiers,
        ...secondary.identifiers
      }
    }

    // Use the most recent timestamp
    if (
      primary.connected &&
      secondary.connected &&
      (secondary?.timestamp || 0) > primary.timestamp
    ) {
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
        (a, b) =>
          this.calculateCapabilityScore(b.capabilities) -
          this.calculateCapabilityScore(a.capabilities)
      )[0]

      // Roughly prefer the most connected of the two clients - this will be established based on the primary provider later
      mergedClient.connectionState = Math.min(
        primary.connectionState ?? ConnectionState.Established,
        secondary.connectionState ?? ConnectionState.Established
      )

      if (primaryProvider.active) {
        mergedClient.connected = primaryProvider.connectionState == ConnectionState.Connected
        // Update the connection state to the provider's connection state
        // This may be upgraded/downgraded if a provider drops out
        mergedClient.connectionState = primaryProvider.connectionState
        mergedClient.primaryProviderId = primaryProvider.providerId
      } else {
        mergedClient.connected = false
        delete mergedClient.primaryProviderId
      }
    }

    return mergedClient
  }

  private static calculateCapabilityScore(capabilities: number[] | undefined): number {
    if (!capabilities || capabilities.length === 0) return 0

    // Sum the capability values - this gives higher weight to more important capabilities
    return capabilities.reduce((sum, capability) => sum + capability, 0)
  }
}

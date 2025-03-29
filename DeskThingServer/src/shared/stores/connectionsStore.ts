import { StoreInterface } from '@shared/interfaces/storeInterface'
import { PotentialDevice } from '@shared/types'
import { Client } from '@deskthing/types'

export type ClientListener = (client: Client[]) => void
export type DeviceListener = (device: PotentialDevice[]) => void

/**
 * Interface representing the ConnectionStore public methods
 */
export interface ConnectionStoreClass extends StoreInterface {
  /**
   * Clears the cache of devices
   */
  clearCache(): Promise<void>

  /**
   * Saves store data to file (no-op for ConnectionStore)
   */
  saveToFile(): Promise<void>

  /**
   * Registers a listener for client changes
   * @param listener Function to call when clients change
   * @returns Function to unregister the listener
   */
  on(listener: ClientListener): Promise<() => void>

  /**
   * Registers a listener for device changes
   * @param listener Function to call when devices change
   * @returns Function to unregister the listener
   */
  onDevice(listener: DeviceListener): Promise<() => void>

  /**
   * Pings a client to check if it's still connected
   * @param connectionId ID of the client to ping
   * @returns True if client exists, false otherwise
   */
  pingClient(connectionId: string): boolean

  /**
   * Gets the list of connected clients
   * @returns Array of clients
   */
  getClients(): Client[]

  /**
   * Gets the list of ADB devices
   * @returns Promise resolving to array of ADB devices
   */
  getDevices(): Promise<PotentialDevice[]>

  /**
   * Adds a new client
   * @param client Client to add
   */
  addClient(client: Client): Promise<void>

  /**
   * Updates an existing client
   * @param connectionId ID of client to update
   * @param updates Partial client object with fields to update
   */
  updateClient(connectionId: string, updates: Partial<Client>): Promise<void>

  /**
   * Removes a client
   * @param connectionId ID of client to remove
   */
  removeClient(connectionId: string): Promise<void>

  /**
   * Removes all clients
   */
  removeAllClients(): Promise<void>

  /**
   * Notifies all client listeners of changes
   */
  notifyListeners(): Promise<void>

  /**
   * Notifies all device listeners of changes
   */
  notifyDeviceListeners(): Promise<void>

  /**
   * Starts or stops auto-detection of ADB devices based on settings
   */
  checkAutoDetectADB(): Promise<void>
}

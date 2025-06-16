import { SocketData } from '@deskthing/types'
import { StoreInterface } from '@shared/interfaces/storeInterface'

/**
 * Interface representing the public methods of MusicStore
 */
export interface MusicStoreClass extends StoreInterface {
  /**
   * Clears the music store cache
   */
  clearCache(): Promise<void>

  /**
   * Saves music store data to file (no-op for MusicStore)
   */
  saveToFile(): Promise<void>

  /**
   * Updates the refresh interval for music data polling
   * @param refreshRate Refresh rate in milliseconds
   */
  updateRefreshInterval(refreshRate: number): Promise<void>

  /**
   * Sets the audio source app for music playback
   * @param source Name of the app to use as audio source
   */
  setAudioSource(source: string): Promise<void>

  /**
   * Handles client requests related to music functionality
   * @param request Socket data containing the client request
   */
  handleClientRequest(request: SocketData): Promise<void>

  /**
   * Sends music data to a specific client
   * @param clientId ID of the client to send music to
   */
  sendMusicToClient(clientId: string): Promise<void>
}

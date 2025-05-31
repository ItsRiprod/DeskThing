/**
 * Represents the interface for an ADB (Android Debug Bridge) service with methods
 * for interacting with Android devices, including device management, configuration,
 * and script execution.
 *
 * @interface ADBServiceClass
 * @description Provides a comprehensive set of methods for device-related operations
 * such as sending commands, running scripts, managing device ports, and retrieving
 * device information.
 */
import { ClientManifest } from '@deskthing/types'
import { SCRIPT_IDs } from '@shared/types'

export interface ADBServiceClass {
  /**
   * Sends an ADB command to a specified device.
   * @param command The command to execute
   * @param deviceId Optional device identifier to target a specific device
   * @returns A promise resolving to the command output as a string
   */
  sendCommand(command: string, deviceId?: string): Promise<string>

  /**
   * Runs a predefined script on a specific device.
   * @param deviceId The identifier of the target device
   * @param scriptId The ID of the script to execute
   * @returns A promise that resolves when the script completes
   */
  runScript(deviceId: string, scriptId: SCRIPT_IDs, force?: boolean): Promise<string>

  /**
   * Retrieves a list of connected ADB devices.
   * @returns A promise resolving to an array of device identifiers
   */
  getDevices(): Promise<string[]>

  /**
   * Opens a specific port on a device.
   * @param deviceId The identifier of the target device
   * @param port The port number to open
   * @returns A promise that resolves when the port is opened
   */
  openPort(deviceId: string, port: number): Promise<void>

  /**
   * Restarts the Chromium browser on a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise that resolves when Chromium is restarted
   */
  restartChromium(deviceId: string): Promise<void>

  /**
   * Pushes a web application to a specific device.
   * @param deviceId The identifier of the target device
   * @param sourcePath The local path of the web application to push
   * @returns A promise that resolves when the web app is pushed
   */
  pushWebApp(deviceId: string, sourcePath: string): Promise<void>

  /**
   * Retrieves the client manifest for a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise resolving to the device's client manifest or null
   */
  getDeviceManifest(deviceId: string): Promise<ClientManifest | null>

  /**
   * Retrieves the manifest version for a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise resolving to the manifest version string
   */
  getDeviceManifestVersion(deviceId: string): Promise<string>

  /**
   * Configures a device with specific settings.
   * @param deviceId The identifier of the target device
   * @param port The port to configure
   * @param forcePush Optional flag to force configuration push
   * @returns A promise that resolves when device is configured
   */
  configureDevice(deviceId: string, port: number, forcePush?: boolean): Promise<void>

  /**
   * Retrieves the version of a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise resolving to the device version string
   */
  getDeviceVersion(deviceId: string): Promise<string>

  /**
   * Retrieves the Unique System Identifier (USID) for a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise resolving to the device's USID or undefined
   */
  getDeviceUSID(deviceId: string): Promise<string | undefined>

  /**
   * Retrieves the Bluetooth MAC address for a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise resolving to the device's Bluetooth MAC address or undefined
   */
  getDeviceMacBT(deviceId: string): Promise<string | undefined>

  /**
   * Sets the screen brightness for a specific device.
   * @param deviceId The identifier of the target device
   * @param value The brightness level to set
   * @returns A promise that resolves when brightness is set
   */
  setBrightness(deviceId: string, value: number): Promise<void>

  /**
   * Restarts a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise that resolves when the device restarts
   */
  restartDevice(deviceId: string): Promise<void>

  /**
   * Shuts down a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise that resolves when the device shuts down
   */
  shutdownDevice(deviceId: string): Promise<void>

  /**
   * Retrieves the current screen brightness of a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise resolving to the current brightness level
   */
  getDeviceBrightness(deviceId: string): Promise<number>

  /**
   * Retrieves the status of the supervisor service for a specific device.
   * @param deviceId The identifier of the target device
   * @returns A promise resolving to a record of supervisor service statuses
   */
  getSupervisorStatus(deviceId: string): Promise<Record<string, string>>

  /**
   * Toggles a specific supervisor service on a device.
   * @param deviceId The identifier of the target device
   * @param key The key of the service to toggle
   * @param value The desired state of the service
   * @returns A promise that resolves when the service is toggled
   */
  toggleSupervisorService(deviceId: string, key: string, value: boolean): Promise<void>
}

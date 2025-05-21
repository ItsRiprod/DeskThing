import { ThemeColor } from '@deskthing/types'
import sharp from 'sharp'
import Logger from '@server/utils/logger'
import { join } from 'node:path'
import { promises } from 'node:fs'
import { app } from 'electron'
import { handleError } from '@server/utils/errorHandler'

/**
 * Service for extracting color information from images
 */
export class ColorExtractor {
  /**
   * Extracts color information from an image URL or base64 string
   * @param input Image URL or base64 data
   * @returns ThemeColor object with color information
   */
  public async extractFromImage(input: string): Promise<ThemeColor> {
    try {
      const imageBuffer = await this.getImageBuffer(input)
      return await this.processImageBuffer(imageBuffer)
    } catch (error) {
      Logger.error(`Failed to extract color from image ${handleError(error)}`, {
        error: error as Error,
        source: 'ColorExtractor'
      })

      return this.getDefaultColor(error)
    }
  }

  /**
   * Converts an image URL or base64 string to a buffer
   */
  private async getImageBuffer(input: string): Promise<Buffer> {
    // Check if input is base64
    if (input.startsWith('data:image')) {
      // Extract base64 data after the comma
      const base64Data = input.split(',')[1]
      return Buffer.from(base64Data, 'base64')
    } else if (input.startsWith('file://')) {
      // Handle local file paths
      const filePath = input.replace('file://', '')
      return await promises.readFile(filePath)
    } else if (input.startsWith('/resource/thumbnail/')) {
      // Handle internal resource paths by reading directly from thumbnails directory
      const thumbnailId = input.replace('/resource/thumbnail/', '')
      const thumbnailPath = join(app.getPath('userData'), 'thumbnails', thumbnailId)
      const fullPath = thumbnailPath.endsWith('.jpg') ? thumbnailPath : `${thumbnailPath}.jpg`
      return await promises.readFile(fullPath)
    } else if (input.startsWith('/resource/image/')) {
      // Handle internal resource image paths from apps directory
      const pathParts = input.replace('/resource/image/', '').split('/')
      const appName = pathParts[0]
      const imageName = pathParts.slice(1).join('/')
      const imagePath = join(app.getPath('userData'), 'apps', appName, 'images', imageName)
      return await promises.readFile(imagePath)
    } else if (input.startsWith('/proxy/')) {
      // For proxy requests, still need to fetch externally
      const response = await fetch(input)
      return Buffer.from(await response.arrayBuffer())
    } else {
      // Assume it's a URL and fetch it
      const response = await fetch(input)
      return Buffer.from(await response.arrayBuffer())
    }
  }
  /**
   * Processes an image buffer to extract color information
   */
  private async processImageBuffer(imageBuffer: Buffer): Promise<ThemeColor> {
    const { dominant } = await sharp(imageBuffer).stats()
    const { r, g, b } = dominant

    // Convert RGB to hex
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`

    // Calculate brightness to determine if color is light or dark
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const isDark = brightness < 128

    return {
      value: [r, g, b],
      rgb: `rgb(${r}, ${g}, ${b})`,
      rgba: `rgba(${r}, ${g}, ${b}, 1)`,
      hex: hex,
      hexa: hex + 'ff',
      isDark: isDark,
      isLight: !isDark
    }
  }

  /**
   * Returns a default black color when extraction fails
   */
  private getDefaultColor(error?: unknown): ThemeColor {
    return {
      value: [0, 0, 0],
      rgb: 'rgb(0, 0, 0)',
      rgba: 'rgba(0, 0, 0, 1)',
      hex: '#000000',
      hexa: '#000000ff',
      isDark: true,
      isLight: false,
      error: error instanceof Error ? error.message : handleError(error)
    }
  }
}

import { color } from '@shared/types'
import sharp from 'sharp'

export const getColorFromImage = async (input: string): Promise<color> => {
  try {
    let imageBuffer: Buffer

    // Check if input is base64
    if (input.startsWith('data:image')) {
      // Extract base64 data after the comma
      const base64Data = input.split(',')[1]
      imageBuffer = Buffer.from(base64Data, 'base64')
    } else {
      // Assume it's a URL and fetch it
      const response = await fetch(input)
      imageBuffer = Buffer.from(await response.arrayBuffer())
    }

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
  } catch (error) {
    return {
      value: [0, 0, 0],
      rgb: 'rgb(0, 0, 0)',
      rgba: 'rgba(0, 0, 0, 1)',
      hex: '#000000',
      hexa: '#000000ff',
      isDark: true,
      isLight: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

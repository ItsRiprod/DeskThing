import { desktopCapturer } from 'electron'

export class MusicController {
  private static instance: MusicController

  static getInstance(): MusicController {
    if (!this.instance) {
      this.instance = new MusicController()
    }

    return this.instance
  }
}
export default MusicController.getInstance()

export const getNowPlaying = async (): Promise<string | null> => {

  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: {
        width: 300,
        height: 300
      }
    })

    // Look for media player windows (e.g. Spotify, iTunes, etc)
    const mediaPlayers = sources.filter(
      (source) =>
        source.name.toLowerCase().includes('spotify') ||
        source.name.toLowerCase().includes('itunes') ||
        source.name.toLowerCase().includes('music')
    )

    console.log(sources.map((source) => source.name))

    if (mediaPlayers.length > 0) {
      // Get the thumbnail of the first found media player
      const thumbnail = mediaPlayers[0].thumbnail.toDataURL()
      return thumbnail
    }

    return null
  } catch (error) {
    console.error('Error getting album art:', error)
    return null
  }
}

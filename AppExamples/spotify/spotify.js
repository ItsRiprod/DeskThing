const axios = require('axios')
const { getImageData } = require('./utility.js')

class SpotifyHandler {
  constructor(sendDataToMainFn) {
    this.BASE_URL = 'https://api.spotify.com/v1/me/player'
    this.TOKEN_URL = 'https://accounts.spotify.com/api/token'
    this.PORT = '8888'
    this.CLIENT_ID = process.env.SPOTIFY_API_ID
    this.CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
    this.sendDataToMainFn = sendDataToMainFn
    this.client_id = undefined
    this.client_secret = undefined
    this.device_id = undefined
    this.access_token = undefined
    this.refresh_token = undefined
    this.redirect_uri = 'http://localhost:8888/callback/spotify'
    this.settings = {
      "refresh_interval": {
        "value": 30000,
        "label": "Refresh interval",
        "options": [
          {
            "value": 0,
            "label": "Disabled"
          },
          {
            "value": 5000,
            "label": "5 seconds"
          },
          {
            "value": 30000,
            "label": "30 seconds"
          },
        ]
      }
    }
  }

  /**
   * Refreshes the Spotify access token.
   * @returns {Promise<string>} The new access token.
   */
  async refreshAccessToken() {

    if (this.refresh_token == undefined) {
      console.log("SPOTIFY: REFRESH TOKEN IS UNDEFINED!! LOGGING IN")
      await this.login()
      return
    }

    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(this.client_id + ':' + this.client_secret).toString('base64')
      },
      data: new URLSearchParams({
        refresh_token: this.refresh_token,
        client_id: this.client_id,
        grant_type: 'refresh_token'
      }).toString()
    }

    try {
      const response = await axios(authOptions)
      this.access_token = response.data.access_token
      this.refresh_token = response.data.refresh_token
      const returnData = {
        Spotify_Access_Token: this.access_token,
        Spotify_Refresh_Token: this.refresh_token
      }
      return returnData
    } catch (error) {
      console.error('Error getting access token:', error)
      throw error
    }
  }

  async getAccessToken(code) {
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(this.client_id + ':' + this.client_secret).toString('base64')
      },
      data: new URLSearchParams({
        code: code,
        redirect_uri: this.redirect_uri,
        grant_type: 'authorization_code'
      }).toString()
    }

    try {
      const response = await axios(authOptions)
      this.access_token = response.data.access_token
      this.refresh_token = response.data.refresh_token
      const returnData = {
        Spotify_Access_Token: this.access_token,
        Spotify_Refresh_Token: this.refresh_token
      }
      return returnData
    } catch (error) {
      console.error('Error getting access token:', error)
      throw error
    }
  }

  async login() {
    console.log('Logging in...')
    const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state'
    const state = 'thisisarandomstringthatshouldbechangedlater'
    const auth_url =
      `https://accounts.spotify.com/authorize?` +
      `response_type=code` +
      `&client_id=${this.client_id}` +
      `&scope=${scope}` +
      `&redirect_uri=${this.redirect_uri}` +
      `&state=${state}`

    await this.sendDataToMainFn('open', auth_url)
  }

  /**
   * Handles API errors, refreshing the token if necessary.
   * @param {Error} error - The error object.
   * @returns {Promise<void>}
   */
  async handleError(error) {
    try {
      if (error.response) {
        if (error.response.status === 401) {
          try {
            await this.refreshAccessToken()
          } catch (refreshError) {
            throw new Error('Error refreshing token:', refreshError)
          }
        } else if (error.response.status === 404) {
          throw new Error(
            '(Ignore if this is a result of skipping/pausing) Error 404: Resource not found in handleError'
          )
        } else {
          throw new Error(`Request failed with status ${error.response.status}`)
        }
      } else {
        throw new Error('Unknown error in handleError', error)
      }
    } catch (error) {
      console.error('There was an error in spotifyHandler!', error)
    }
  }

  /**
   * Makes an authenticated request to the Spotify API.
   * @param {string} method - The HTTP method (get, put, post).
   * @param {string} url - The request URL.
   * @param {Object} [data=null] - The request data.
   * @returns {Promise<Object|boolean>} The response data.
   */
  async makeRequest(method, url, data = null) {
    try {
      if (!this.access_token || this.access_token == null) {
        console.log('Refreshing access token')
        await this.refreshAccessToken()
      }
    } catch (error) {
      await this.handleError(error)
    }

    const headers = {
      Authorization: `Bearer ${this.access_token}`
    }

    try {
      const response = await axios({ method, url, data, headers })
      return response.data ? response.data : true
    } catch (error) {
      await this.handleError(error)
      if (error.response && error.response.status === 404) {
        return
      }
      if (error.response && error.response.status === 403) {
        console.log('Error 403 reached! Bad OAuth (Cancelling Request)')
        console.error(error.response)
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait five seconds
      console.log('SPOTIFY REQUEST: Retrying', method, url, data)
      const retryResponse = await this.makeRequest(method, url, data)
      return retryResponse.data != null ? retryResponse.data : true
    }
  }

  async getCurrentPlayback() {
    const url = `${this.BASE_URL}/currently-playing`
    return this.makeRequest('get', url)
  }

  async getCurrentEpisode() {
    const url = `${this.BASE_URL}/currently-playing?additional_types=episode`
    return this.makeRequest('get', url)
  }

  async getCurrentDevice() {
    const url = this.BASE_URL
    return this.makeRequest('get', url)
  }

  async skipToNext(songUrl) {
    const url = `${this.BASE_URL}/next`
    await this.makeRequest('post', url)
    return await this.returnSongData(songUrl) 
  }

  async skipToPrev(songUrl) {
    const url = `${this.BASE_URL}/previous`
    await this.makeRequest('post', url)
    return await this.returnSongData(songUrl) 
  }

  async play(uri, context, position) {
    const url = `${this.BASE_URL}/play`
    const body =
      position && uri ? { context_uri: context, offset: { uri }, position_ms: position } : null
    return this.makeRequest('put', url, body)
  }

  async setShuffle(state) {
    const url = `${this.BASE_URL}/shuffle?state=${state}`
    return this.makeRequest('put', url)
  }

  async setRepeat(state) {
    const url = `${this.BASE_URL}/repeat?state=${state}`
    return this.makeRequest('put', url)
  }

  async seek(position) {
    const url = `${this.BASE_URL}/seek?position_ms=${position}`
    return this.makeRequest('put', url)
  }

  async pause() {
    const url = `${this.BASE_URL}/pause`
    return this.makeRequest('put', url)
  }

  async setVolume(newVol) {
    const url = `${this.BASE_URL}/volume?volume_percent=${newVol}`
    return this.makeRequest('put', url)
  }

  async returnSongData(oldUri = null) {
    try {
      const startTime = Date.now()
      const timeout = 1000000
      let delay = 100
      let currentPlayback
      let newTrackUri

      do {
        currentPlayback = await this.getCurrentPlayback()
        if (currentPlayback.currently_playing_type === 'track') {
          newTrackUri = currentPlayback.item.uri
          if (delay !== 100)
            console.log(
              `Song not updated... trying again | timeout: ${timeout} cur time: ${Date.now() - startTime} delay: ${delay}`
            )
          else
            console.log(
              `Getting Current Playback: old url ${oldUri} new url ${newTrackUri}, date now: ${Date.now()}`
            )

          delay *= 1.3
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          currentPlayback = await this.getCurrentEpisode()
          console.log('Playing a podcast!')
        }
      } while (newTrackUri === oldUri && Date.now() - startTime < timeout && delay < 500)

      if (newTrackUri === oldUri) {
        throw new Error('Timeout Reached!')
      }
      let songData

      if (currentPlayback.currently_playing_type === 'track') {
        songData = {
          photo: null,
          duration_ms: currentPlayback.item.duration_ms,
          name: currentPlayback.item.name,
          progress_ms: currentPlayback.progress_ms,
          is_playing: currentPlayback.is_playing,
          artistName: currentPlayback.item.artists[0].name,
          uri: currentPlayback.item.uri,
          playlistUri: currentPlayback.context.uri,
          albumName: currentPlayback.item.album.name
        }
        this.sendDataToMainFn('data', { type: 'song_data', data: songData })
        const imageUrl = currentPlayback.item.album.images[0].url
        const imageData = await getImageData(imageUrl)

        this.sendDataToMainFn('data', { type: 'img_data', data: imageData })
      } else {
        songData = {
          photo: null,
          duration_ms: currentPlayback.item.duration_ms,
          name: currentPlayback.item.name,
          progress_ms: currentPlayback.progress_ms,
          is_playing: currentPlayback.is_playing,
          artistName: currentPlayback.item.show.publisher,
          uri: currentPlayback.item.uri,
          playlistUri: currentPlayback.context.uri,
          albumName: currentPlayback.item.show.name
        }
        this.sendDataToMainFn('data', { type: 'song_data', data: songData })

        this.sendDataToMainFn('data', { type: 'song_data', data: songData })
        const imageUrl = currentPlayback.item.images[0].url
        const imageData = await getImageData(imageUrl)

        this.sendDataToMainFn('data', { type: 'img_data', data: imageData })
      }
    } catch (error) {
      console.error('Error getting song data:', error)
      return error.message
    }
  }

  async returnDeviceData() {
    try {
      const playbackState = await this.getCurrentDevice();
      this.sendDataToMainFn('data', {
        type: 'device_data',
        data: {
          device: {
            id: playbackState.device.id,
            name: playbackState.device.name,
            is_active: playbackState.device.id === process.env.DEVICE_ID,
            volume_percent: playbackState.device.volume_percent,
          },
          is_playing: playbackState.is_playing,
          shuffle_state: playbackState.shuffle_state,
          repeat_state: playbackState.repeat_state,
        },
      });
    } catch (error) {
      console.error('Error getting device data:', error)
      return error.message
    }
  }
}

module.exports = SpotifyHandler

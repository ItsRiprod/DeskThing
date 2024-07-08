const axios = require('axios')
const { getImageData } = require('./utility.js')
const fs = require('fs');
const path = require('path');

class SpotifyHandler {
  constructor(sendDataToMainFn) {
    this.BASE_URL = 'https://api.spotify.com/v1/me/player'
    this.TOKEN_URL = 'https://accounts.spotify.com/api/token'
    this.PORT = '8888'
    this.CLIENT_ID = process.env.SPOTIFY_API_ID
    this.CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
    this.sendDataToMainFn = sendDataToMainFn
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
    };

    const manifestPath = path.join(__dirname, 'manifest.json');
    this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    this.sendLog('Manifest loaded:' + this.manifest);
  }

  async sendLog(message) {
    this.sendDataToMainFn('log', message)
  }
  async sendError(message) {
    this.sendDataToMainFn('error', message)
  }

  /**
   * Refreshes the Spotify access token.
   * @returns {Promise<string>} The new access token.
   */
  async refreshAccessToken() {

    if (this.refresh_token == undefined) {
      this.sendError("REFRESH TOKEN IS UNDEFINED!! LOGGING IN")
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
      this.sendError('Error getting access token!')
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
      this.sendError('Error getting access token:' + error)
      throw error
    }
  }

  async login() {
    this.sendLog('Logging in...')
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
      this.sendError(`There was an error in spotify's ErrorHandler ${error}`)
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
    this.sendLog(`Handling request to url ${url}`)
    try {
      if (!this.access_token || this.access_token == null) {
        this.sendLog('Refreshing access token')
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
        this.sendError('Error 403 reached! Bad OAuth (Cancelling Request)')
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait five seconds
      this.sendLog('Retrying', method, url, data)
      const retryResponse = await this.makeRequest(method, url, data)
      return retryResponse.data != null ? retryResponse.data : true
    }
  }

  async getCurrentPlayback() {
    const url = `${this.BASE_URL}`
    return this.makeRequest('get', url)
  }

  async getCurrentEpisode() {
    const url = `${this.BASE_URL}?additional_types=episode`
    return this.makeRequest('get', url)
  }

  async next(id) {
    const url = `${this.BASE_URL}/next`
    await this.makeRequest('post', url)
    return await this.returnSongData(id) 
  }

  async previous() {
    const url = `${this.BASE_URL}/previous`
    await this.makeRequest('post', url)
    return await this.returnSongData() 
  }

  async fastForward(seconds = 15) {
    try {
      const playback = await this.getCurrentPlayback();
      const currentPosition = playback.progress_ms;
      const newPosition = currentPosition + seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      this.sendError('Error fast forwarding!' + error);
    }
  }

  async rewind(seconds = 15) {
    try {
      const playback = await this.getCurrentPlayback();
      const currentPosition = playback.progress_ms;
      const newPosition = currentPosition - seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      this.sendError('Error fast forwarding!' + error);
    }
  }

  async play(context) {
    const url = `${this.BASE_URL}/play`
    const body =
      context.playlist && context.id && context.position ? { context_uri: context.playlist, offset: {"uri":`spotify:track:${context.id}` }, position_ms: context.position } : null
    return this.makeRequest('put', url, body)
  }

  async pause() {
    const url = `${this.BASE_URL}/pause`
    return this.makeRequest('put', url)
  }

  async seek(position) {
    const url = `${this.BASE_URL}/seek?position_ms=${position}`
    return this.makeRequest('put', url)
  }

  async like(state) {
    const trackInfo = await getCurrentPlayback()
    if (trackInfo && trackInfo.item.id) {
      const id = trackInfo.item.id
      const url = `${this.BASE_URL}/me/tracks?ids=${id}`
      
      if (state) {
        return this.makeRequest('put', url)
      } else {
        return this.makeRequest('delete', url)
      }
    }
  }

  async volume(newVol) {
    const url = `${this.BASE_URL}/volume?volume_percent=${newVol}`
    return this.makeRequest('put', url)
  }

  async repeat(state) {
    if (state == 'all') {
      const url = `${this.BASE_URL}/repeat?state=context`
      return this.makeRequest('put', url)
    }
    const url = `${this.BASE_URL}/repeat?state=${state}`
    return this.makeRequest('put', url)
  }

  async shuffle(state) {
    const url = `${this.BASE_URL}/shuffle?state=${state}`
    return this.makeRequest('put', url)
  }

  async returnSongData(id = null) {
    try {
      const startTime = Date.now()
      const timeout = 1000000
      let delay = 100
      let currentPlayback
      let new_id

      do {
        currentPlayback = await this.getCurrentPlayback()
        if (currentPlayback.currently_playing_type === 'track') {
          new_id = currentPlayback.item.id
          if (delay !== 100) {

            this.sendLog(`Song has not changed. Trying again...`)
          }
            
          delay *= 1.3 // how long to increase the delay between attempts
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          currentPlayback = await this.getCurrentEpisode()
          this.sendLog('Playing a podcast!')
        }
      } while (new_id === id && Date.now() - startTime < timeout && delay < 1000)

      if (new_id === id) {
        throw new Error('Timeout Reached!')
      }
      let songData

      if (currentPlayback.currently_playing_type === 'track') {
        songData = {
          album: currentPlayback?.item.album.name,
          artist: currentPlayback?.item.album.artists[0].name,
          playlist: currentPlayback?.context.type,
          playlist_id: currentPlayback?.context.uri,
          track_name: currentPlayback?.item.name,
          shuffle_state: currentPlayback?.shuffle_state,
          repeat_state: currentPlayback?.repeat_state == 'context' ? 'all' : currentPlayback.repeat_state,
          is_playing: currentPlayback?.is_playing,
          can_fast_forward: !currentPlayback?.disallows?.seeking || true,
          can_skip: !currentPlayback?.disallows?.skipping_next || true,
          can_like: true,
          can_change_volume: currentPlayback?.device.supports_volume || true,
          can_set_output: !currentPlayback?.disallows?.transferring_playback || true,
          track_duration: currentPlayback?.item.duration_ms,
          track_progress: currentPlayback?.progress_ms,
          volume: currentPlayback?.device.volume_percent,
          device: currentPlayback?.device.name,
          device_id: currentPlayback?.device.id,
          id: currentPlayback?.item.id,
          thumbnail: null,
        }
        this.sendDataToMainFn('data', { app: 'client', type: 'song', data: songData })
        const imageUrl = currentPlayback.item.album.images[0].url
        songData.thumbnail = await getImageData(imageUrl)

        this.sendDataToMainFn('data', { app: 'client', type: 'song', data: songData })
      } else {
        songData = {
          album: currentPlayback.item.show.name,
          artist: currentPlayback.item.show.publisher,
          playlist: currentPlayback.context.type,
          playlist_id: currentPlayback.context.uri,
          track_name: currentPlayback.item.name,
          shuffle_state: currentPlayback.shuffle_state,
          repeat_state: currentPlayback.repeat_state == 'context' ? 'all' : currentPlayback.repeat_state,
          is_playing: currentPlayback.is_playing,
          can_fast_forward: false,
          can_skip: !currentPlayback.disallows.skipping_next,
          can_like: true,
          can_change_volume: currentPlayback.device.supports_volume,
          can_set_output: !currentPlayback.disallows.transferring_playback,
          track_duration: currentPlayback.item.duration_ms,
          track_progress: currentPlayback.progress_ms,
          volume: device.volume_percent,
          device: currentPlayback.device.name,
          device_id: currentPlayback.device.id,
          id: currentPlayback.item.id,
          thumbnail: null,
        }
        // Send the data immediately
        this.sendDataToMainFn('data', { app: 'client',type: 'song', data: songData })

        // Get the image and send that later
        const imageUrl = currentPlayback.item.images[0].url
        songData.thumbnail = await getImageData(imageUrl)

        this.sendDataToMainFn('data', { app: 'client',type: 'song', data: songData })
      }
    } catch (error) {
      this.sendError('Error getting song data:' + error)
      return error.message
    }
  }
}

module.exports = SpotifyHandler

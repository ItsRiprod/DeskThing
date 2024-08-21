import axios, { AxiosError, isAxiosError } from 'axios'
import { DeskThing as DK, Settings } from 'deskthing-server'

export type SongData = {
  album: string | null
  artist: string | null
  playlist: string | null
  playlist_id: string | null
  track_name: string
  shuffle_state: boolean | null
  repeat_state: 'off' | 'all' | 'track' 
  is_playing: boolean
  can_fast_forward: boolean
  can_skip: boolean
  can_like: boolean
  can_change_volume: boolean
  can_set_output: boolean 
  track_duration: number | null
  track_progress: number | null
  volume: number 
  thumbnail: string | null 
  device: string | null 
  id: string | null 
  device_id: string | null 
}

type settings = {
  output_device: {
    value: string
    label: string
    options: {
      value: string
      label: string
    }[]
  }
  change_source: {
    value: string
    label: string
    options: {
      value: string
      label: string
    }[]
  }
}

type savedData = {
  settings?: settings | Settings
  client_id?: string
  client_secret?: string
  access_token?: string
  refresh_token?: string
  device_id?: string
  redirect_uri?: string
  refresh_interval?: number
}

type method = 'get' | 'put' | 'post' | 'delete'


class SpotifyHandler {
  public Data: savedData = {}
  private DeskThing: DK
  private BASE_URL = 'https://api.spotify.com/v1/me/player'
  private currentSongId: string = ""

  constructor() {
    this.DeskThing = DK.getInstance()
    this.DeskThing.on('data', (data) => {
      this.Data = data
      console.log('Got more data', data)
    })
    this.initializeData()
  }

  async initializeData() {
    const data = await this.DeskThing.getData()
    if (data) {
      this.Data = data 
    }
    

    if (!this.Data.settings?.change_source) {
      const settings = {
        "change_source": {
          "value": 'true',
          "label": "Switch Output on Select",
          "options": [
            {
              "value": "true",
              "label": "Switch"
            },
            {
              "value": "false",
              "label": "Dont Switch"
            }
          ]
        },
        "output_device": {
          "value": "default",
          "label": "Output Device",
          "options": [
            {
              "value": "default",
              "label": "Default"
            }
          ]
        },
      }
      this.DeskThing.addSettings(settings)
    }

    if (!this.Data.client_id || !this.Data.client_secret) {
      const requestScopes = {
        'client_id': {
          'value': '',
          'label': 'Spotify Client ID',
          'instructions': 'You can get your Spotify Client ID from the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: lightblue;">Spotify Developer Dashboard</a>. You must create a new application and then under "Client ID" Copy and paste that into this field.',
        },
        'client_secret': {
          'value': '',
          'label': 'Spotify Client Secret',
          'instructions': 'You can get your Spotify Client Secret from the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: lightblue;">Spotify Developer Dashboard</a>. You must create a new application and then under "View Client Secret", Copy and paste that into this field.',
        },
        'redirect_uri': {
          'value': 'http://localhost:8888/callback/spotify',
          'label': 'Redirect URL',
          'instructions': 'Set the Spotify Redirect URI to http://localhost:8888/callback/spotify and then click "Save".\n This ensures you can authenticate your account to this application',
        }
      }
  
      this.DeskThing.getUserInput(requestScopes, (data) => {
        console.log('Data Response', data)
        if (data.payload.client_id && data.payload.client_secret) {
          this.DeskThing.saveData(data.payload)
          this.login()
        } else {
          this.DeskThing.sendError('Please fill out all the fields! Restart Spotify to try again')
        }
      })  
    } else {
      this.DeskThing.sendLog('Data Found!')
      this.refreshAccessToken()
    }
  }

  /**
   * Refreshes the Spotify access token.
   * @returns {Promise<string>} The new access token.
   */
  async refreshAccessToken(): Promise<string | void> {
    if (!this.Data.client_id || !this.Data.client_secret) {
      this.DeskThing.sendError('No client_id or client_secret! Cancelling refresh access token request!')
      return
    }

    if (!this.Data.refresh_token) {
      this.DeskThing.sendError("Refresh Token is undefined! Authenticating")
      await this.login()
      return
    }

    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(this.Data.client_id + ':' + this.Data.client_secret).toString('base64')
      },
      data: new URLSearchParams({
        refresh_token: this.Data.refresh_token,
        grant_type: 'refresh_token'
      }).toString()
    }

    try {
      const response = await axios(authOptions)
      this.DeskThing.sendLog('Access token refreshed!')
      const access_token = response.data.access_token
      this.DeskThing.saveData({access_token: access_token})
      if (response.data.refresh_token) {
        this.DeskThing.saveData({refresh_token: response.data.refresh_token})
      } else {
        console.log('No access token returned!')
      }
      return
    } catch (error) {
      this.DeskThing.sendError('Error getting access token!' + error)
      if (!isAxiosError(error)) return
      
      if (error.response && error.response.status === 400) {
        this.DeskThing.sendLog('Refresh Tokens returned code 400 - Logging in')
        await this.login()
      }
      throw error
    }
  }

  /**
   * 
   * @param code Code returned by logging in
   * @returns 
   */

  async getAccessToken(code: string): Promise<void | string> {
    if (!this.Data.client_id || !this.Data.client_secret || !this.Data.redirect_uri) {
      this.DeskThing.sendError('No client_id or client_secret! Cancelling access token request!')
      return
    }

    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(this.Data.client_id + ':' + this.Data.client_secret).toString('base64')
      },
      data: new URLSearchParams({
        code: code,
        redirect_uri: this.Data.redirect_uri,
        grant_type: 'authorization_code'
      }).toString()
    }

    try {
      const response = await axios(authOptions)
      this.DeskThing.sendLog('Access token refreshed!')
      const access_token = response.data.access_token
      this.DeskThing.saveData({access_token: access_token})
      if (response.data.refresh_token) {
        this.DeskThing.saveData({refresh_token: response.data.refresh_token})
      } else {
        console.log('No access token returned!')
      }
      return
    } catch (error) {
      this.DeskThing.sendError('Error getting access token:' + error)
      throw error
    }
  }

  async login() {

    console.log('Current Data: ', this.Data)
    if (!this.Data.client_id || !this.Data.client_secret || !this.Data.redirect_uri) {
      this.DeskThing.sendError('No client_id or client_secret! Cancelling access token request!')
      throw Error('No Client_ID or Client_Secret!')
    }
    this.DeskThing.sendLog('Logging in...')
    const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state'
    const state = 'thisisarandomstringthatshouldbechangedlater'
    const auth_url =
      `https://accounts.spotify.com/authorize?` +
      `response_type=code` +
      `&client_id=${this.Data.client_id}` +
      `&scope=${scope}` +
      `&redirect_uri=${this.Data.redirect_uri}` +
      `&state=${state}`

    await this.DeskThing.openUrl(auth_url)
  }

  /**
   * Handles API errors, refreshing the token if necessary.
   * @param {Error} error - The error object.
   * @returns {Promise<void>}
   */
  async handleError(error: AxiosError): Promise<void> {
    try {
      if (error.response) {
        if (error.response.status === 401) {
          try {
            await this.refreshAccessToken()
          } catch (refreshError) {
            throw new Error('Error refreshing token:' + refreshError)
          }
        } else if (error.response.status === 404) {
          throw new Error(
            '(Ignore if this is a result of skipping/pausing) Error 404: Resource not found in handleError'
          )
        } else {
          throw new Error(`Request failed with status ${error.response.status}`)
        }
      } else {
        throw new Error('Unknown error in handleError' + error)
      }
    } catch (error) {
      this.DeskThing.sendError(`There was an error in spotify's ErrorHandler ${error}`)
    } 
  }


  
  /**
   * Makes an authenticated request to the Spotify API.
   * @param {string} method - The HTTP method (get, put, post).
   * @param {string} url - The request URL.
   * @param {Object} [data=null] - The request data.
   * @returns {Promise<Object|boolean>} The response data.
   */
  async makeRequest(method: method, url: string, data: any = null, attempt: number = 0): Promise<any> {
    if (this.DeskThing.stopRequested) return // kill if the app has been asked to stop

    this.DeskThing.sendLog(`Handling request to url ${url}`)
    try {
      if (!this.Data.client_id || !this.Data.client_secret) {
        this.DeskThing.sendError('No client_id or client_secret! Cancelling refresh access token request!')
        throw new Error('No client_id or client_secret')
      }
      if (!this.Data.access_token || this.Data.access_token == null) {
        this.DeskThing.sendLog('Refreshing access token');
        await this.refreshAccessToken();
        // After refreshing the token, ensure to proceed with the request
      }
  
      const headers = {
        Authorization: `Bearer ${this.Data.access_token}`
      };
  
      try {
        const response = await axios({ method, url, data, headers });
        return response.data !== undefined ? response.data : true;
      } catch (error) {
        if (!error) return

        if (!isAxiosError(error)) return

        await this.handleError(error);
        if (error.response && error.response.status === 404) {
          return;
        }
        if (error.response && error.response.status === 403) {
          this.DeskThing.sendError('Error 403 reached! Bad OAuth (Cancelling Request)');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait five seconds
        if (attempt < 8) {
          this.DeskThing.sendLog('Retrying! Attempt #' + attempt + ' ' + method + url + data);
          const retryResponse = await this.makeRequest(method, url, data, attempt + 1);
          return retryResponse !== undefined ? retryResponse : true;
        } else {
          this.DeskThing.sendLog('Failed to make request after 8 attempts. Cancelling request.');
        }
      }
    } catch (error) {
      this.DeskThing.sendError(`Failed to refresh access token in makeRequest() ${error}`);
      if (!isAxiosError(error)) return
      await this.handleError(error);
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

  async next(id: string = '') {
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
      this.DeskThing.sendError('Error fast forwarding!' + error);
    }
  }

  async rewind(seconds = 15) {
    try {
      const playback = await this.getCurrentPlayback();
      const currentPosition = playback.progress_ms;
      const newPosition = currentPosition - seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      this.DeskThing.sendError('Error fast forwarding!' + error);
    }
  }

  async play(context: {playlist: string, id: string, position: number}) {
    const url = `${this.BASE_URL}/play`;
    let body = null;
  
    if (context.playlist && context.id && context.position) {
      body = {
        context_uri: context.playlist,
        offset: { uri: `spotify:track:${context.id}` },
        position_ms: context.position,
      };
    }
  
    return this.makeRequest('put', url, body);
  }

  async pause() {
    const url = `${this.BASE_URL}/pause`
    return this.makeRequest('put', url)
  }

  async seek(position: string | number) {
    const url = `${this.BASE_URL}/seek?position_ms=${position}`
    return this.makeRequest('put', url)
  }

  async like(state: boolean) {
    const trackInfo = await this.getCurrentPlayback()
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

  async volume(newVol: number) {
    const url = `${this.BASE_URL}/volume?volume_percent=${newVol}`
    return this.makeRequest('put', url)
  }

  async repeat(state: string) {
    if (state == 'all') {
      const url = `${this.BASE_URL}/repeat?state=context`
      return this.makeRequest('put', url)
    }
    const url = `${this.BASE_URL}/repeat?state=${state}`
    return this.makeRequest('put', url)
  }

  async shuffle(state: string) {
    const url = `${this.BASE_URL}/shuffle?state=${state}`
    return this.makeRequest('put', url)
  }

  async transfer() {
    try {
      if (this.Data.settings?.output_device.value !== 'default' && this.Data.settings?.output_device.value) {
        this.transferPlayback(this.Data.settings.output_device.value as string);
        this.DeskThing.sendLog('Transferred successfully')
      }
    } catch (error) {
      this.DeskThing.sendError('Error changing playback!' + error)
    }
  }
  
  async transferPlayback(deviceId: string) {
    this.DeskThing.sendLog(`Transferring playback to ${deviceId}`)
    const url = `${this.BASE_URL}`;
    const body = { device_ids: [deviceId], play: true };
    await this.makeRequest('put', url, body);
  }

  async checkForRefresh() {
    console.log('Checking for refresh...')
    const currentPlayback = await this.getCurrentPlayback()

    if (currentPlayback.currently_playing_type === 'track') {
      const songData = {
        album: currentPlayback?.item.album?.name || 'Not Found',
        artist: currentPlayback?.item.album?.artists[0].name || 'Not Found',
        playlist: currentPlayback?.context?.type || 'Not Found',
        playlist_id: currentPlayback?.context?.uri || '123456',
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
      }

      this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: songData })
    } else {
      this.DeskThing.sendLog('Unable to refresh... song not playing!')
    }
    
  }

  async returnSongData(id: string | null = null) {
    try {
      const startTime = Date.now()
      const timeout = 5000
      let delay = 500
      let currentPlayback
      let new_id

      do {
        currentPlayback = await this.getCurrentPlayback()
        if (this.DeskThing.stopRequested) {
          this.DeskThing.sendLog('Stop requested!')
          throw new Error('Stop requested!')
        }
        if (currentPlayback.currently_playing_type === 'track') {
          new_id = currentPlayback.item.id
          if (delay !== 500) {
            this.DeskThing.sendLog(`Song has not changed. Trying again...`)
          }
            
          delay *= 1.3 // how long to increase the delay between attempts
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else if (currentPlayback.currently_playing_type === 'show') {
          currentPlayback = await this.getCurrentEpisode()
          this.DeskThing.sendLog('Playing a podcast!')
        } else {
          this.DeskThing.sendError('No song is playing or detected!')
          new_id = null
          delay = 9999
        }
      } while (new_id === id && Date.now() - startTime < timeout && delay < 1000)

      if (new_id === id) {
        throw new Error('Timeout Reached!')
      }

      let songData: Partial<SongData>

      if (currentPlayback.currently_playing_type === 'track') {
        songData = {
          album: currentPlayback?.item.album?.name || 'Not Found',
          artist: currentPlayback?.item.album?.artists[0].name || 'Not Found',
          playlist: currentPlayback?.context?.type || 'Not Found',
          playlist_id: currentPlayback?.context?.uri || '123456',
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
        }

        
        const deviceExists = this.Data.settings && this.Data.settings.output_device.options.some(
          (option) => option.value === currentPlayback.device.id
        );
  
        if (!deviceExists) {
          // Update options with the new device
          this.DeskThing.sendLog(`Adding new device ${currentPlayback.device.name} to device list...`)
          this.Data.settings && this.Data.settings.output_device.options.push({
            value: currentPlayback.device.id,
            label: currentPlayback.device.name,
          });

          this.DeskThing.saveData({ settings: this.Data.settings})
        }

        this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: songData })
        const imageUrl = currentPlayback.item.album.images[0].url
        const encodedImage = await this.DeskThing.encodeImageFromUrl(imageUrl, 'jpeg')

        // Only update the thumbnail
        this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: { thumbnail: encodedImage}  })
      } else if (currentPlayback.currently_playing_type === 'show') {
        songData = {
          album: currentPlayback?.item.show.name,
          artist: currentPlayback?.item.show.publisher,
          playlist: currentPlayback?.context?.type || 'Not Found',
          playlist_id: currentPlayback?.context?.uri || '123456',
          track_name: currentPlayback?.item.name,
          shuffle_state: currentPlayback?.shuffle_state,
          repeat_state: currentPlayback?.repeat_state == 'context' ? 'all' : currentPlayback.repeat_state,
          is_playing: currentPlayback?.is_playing,
          can_fast_forward: !currentPlayback?.disallows?.seeking || true,
          can_skip: !currentPlayback?.disallows?.skipping_next || true,
          can_like: true,
          can_change_volume: currentPlayback?.device?.supports_volume  || true,
          can_set_output: !currentPlayback?.disallows?.transferring_playback  || true,
          track_duration: currentPlayback?.item.duration_ms,
          track_progress: currentPlayback?.progress_ms,
          volume: currentPlayback?.device.volume_percent,
          device: currentPlayback?.device.name,
          device_id: currentPlayback?.device.id,
          id: currentPlayback?.item.id,
          thumbnail: null,
        }

        const deviceExists = this.Data.settings && this.Data.settings.output_device.options.some(
          (option) => option.value === currentPlayback.device.id
        );
  
        if (!deviceExists) {
          // Update options with the new device
          this.DeskThing.sendLog(`Adding new device ${currentPlayback.device.name} to device list...`)
          this.Data.settings && this.Data.settings.output_device.options.push({
            value: currentPlayback.device.id,
            label: currentPlayback.device.name,
          });

          this.DeskThing.saveData({ settings: this.Data.settings})
        }

        this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: songData })
        const imageUrl = currentPlayback.item.album.images[0].url
        const encodedImage = await this.DeskThing.encodeImageFromUrl(imageUrl, 'jpeg')

        // Only update the thumbnail
        this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: { thumbnail: encodedImage}  })
      } else {
        this.DeskThing.sendError('Song/Podcast type not supported!')
      }
    } catch (error) {
      this.DeskThing.sendError('Error getting song data:' + error)
      return error
    }
  }
}

export default SpotifyHandler

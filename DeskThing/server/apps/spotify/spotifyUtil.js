
import axios from "axios";
import { getData, setData } from "../../util/dataHandler.js";
import open from "open";
import { getImageData } from "../../util/imageUtil.js"
import { sendMessageToClients, sendError } from '../../util/socketHandler.js'

const BASE_URL = "https://api.spotify.com/v1/me/player";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const PORT = process.env.PORT;
const CLIENT_ID = process.env.SPOTIFY_API_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;


/**
 * Refreshes the Spotify access token.
 * @returns {Promise<string>} The new access token.
 */
const refreshAccessToken = async () => {
  console.log("Refreshing token...");

  const refreshToken = getData("refreshToken");

  if (!refreshToken) {
      try {
        await open(`http://localhost:${PORT}/login`);
        console.error("SPOTIFY: Refreshing token with website")
        throw new Error("Invalid Access Token! Refreshing...");
      } catch (err) {
        throw new Error("Error opening browser:", err);
      }

  }

  const data = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  try {
    console.log('Refreshing Token', TOKEN_URL, data )
    const response = await axios.post(TOKEN_URL, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = response.data.access_token;
    setData("spotifyToken", accessToken);
    console.log('Token Refreshed!')
    return accessToken;
  } catch (error) {
    throw new Error("Error refreshing access token:", error);
  }
};

/**
 * Handles API errors, refreshing the token if necessary.
 * @param {Error} error - The error object.
 * @returns {Promise<void>}
 */
const handleError = async (error) => {
  try {
    if (error.response) {
      if (error.response.status === 401) {
        try {
          await refreshAccessToken();
        } catch (refreshError) {
          throw new Error("Error refreshing token:", refreshError);
        }
      } else if (error.response.status === 404) {
        throw new Error('(Ignore if this is a result of skipping/pausing) Error 404: Resource not found in handleError')
      } else {
        throw new Error(`Request failed with status ${error.response.status}`);
      }
    } else {
      throw new Error('Unknown error in handleError', error);
    }
    }
      catch (error) {
        console.error('There was an error in spotifyHandler!', error)
      }
};

/**
 * Makes an authenticated request to the Spotify API.
 * @param {string} method - The HTTP method (get, put, post).
 * @param {string} url - The request URL.
 * @param {Object} [data=null] - The request data.
 * @returns {Promise<Object|boolean>} The response data.
 */
const makeRequest = async (method, url, data = null) => {
  let accessToken = await getData("spotifyToken");
  try {

    if (!accessToken || accessToken == null) {
      console.log("Refreshing access token");
      accessToken = await refreshAccessToken();
    }
  } catch (error) {
    await handleError(error);
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
      console.log('SPOTIFY REQUEST: ', method, url, data)
      const response = await axios({ method, url, data, headers });
      return response.data ? response.data : true;
  } catch (error) {
    await handleError(error);
    if (error.response && error.response.status === 404) {
      return;
    }
    if (error.response && error.response.status === 403) {
      console.log('Error 403 reached! Bad OAuth (Cancelling Request)');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait five seconds
    console.log('SPOTIFY REQUEST: Retrying', method, url, data);
    const retryResponse = makeRequest( method, url, data );
    return retryResponse.data != null ? retryResponse.data : true;
  }
};

/**
 * Gets the current playback information.
 * @returns {Promise<Object>} The current playback information.
 */
const getCurrentPlayback = async () => {
  const url = `${BASE_URL}/currently-playing`;
  return makeRequest("get", url);
};
/**
 * Gets the current playback information.
 * @returns {Promise<Object>} The current playback information.
 */
const getCurrentEpisode = async () => {
  const url = `${BASE_URL}/currently-playing?additional_types=episode`;
  return makeRequest("get", url);
};

/**
 * Gets the current device information.
 * @returns {Promise<Object>} The current device information.
 */
const getCurrentDevice = async () => {
  const url = BASE_URL;
  return makeRequest("get", url);
};

/**
 * Skips to the next track.
 * @returns {null}
 */
const skipToNext = async () => {
  const url = `${BASE_URL}/next`;
  makeRequest("post", url);
};

/**
 * Skips to the previous track.
 * @returns {Promise<void>}
 */
const skipToPrev = async () => {
    const url = `${BASE_URL}/previous`;
    return await makeRequest("post", url);
};

/**
 * Plays a track.
 * @param {string} uri - The track URI.
 * @param {string} context - The context URI.
 * @param {number} position - The position in milliseconds.
 * @returns {Promise<void>}
 */
const play = async (uri, context, position) => {
  const url = `${BASE_URL}/play`;
  const body =
    position && uri
      ? { context_uri: context, offset: { uri }, position_ms: position }
      : null;
  return makeRequest("put", url, body);
};

/**
 * Sets shuffle state.
 * @param {boolean} state - The state to set the shuffle.
 * @returns {Promise<void>}
 */
const setShuffle = async (state) => {
  const url = `${BASE_URL}/shuffle?state=${state}`;
  return makeRequest("put", url);
};

/**
 * Sets repeat state.
 * @param {string} state - The state to set the repeat (track, context, or off).
 * @returns {Promise<void>}
 */
const setRepeat = async (state) => {
  const url = `${BASE_URL}/repeat?state=${state}`;
  return makeRequest("put", url);
};

/**
 * Seeks to a position in the current track.
 * @param {number} position - The position in milliseconds.
 * @returns {Promise<void>}
 */
const seek = async (position) => {
  const url = `${BASE_URL}/seek?position_ms=${position}`;
  return makeRequest("put", url);
};

/**
 * Pauses the current playback.
 * @returns {Promise<void>}
 */
const pause = async () => {
  const url = `${BASE_URL}/pause`;
  return makeRequest("put", url);
};

/**
 * Sets the volume.
 * @param {number} newVol - The new volume percentage.
 * @returns {Promise<void>}
 */
const setVolume = async (newVol) => {
  const url = `${BASE_URL}/volume?volume_percent=${newVol}`;
  return makeRequest("put", url);
};

const returnSongData = async (socket, oldUri = null) => {
  try {
    const startTime = Date.now();
    const timeout = 1000000;
    let delay = 100;
    let currentPlayback;
    let newTrackUri;

    do {
      currentPlayback = await getCurrentPlayback();
      if (currentPlayback.currently_playing_type === "track") {

        newTrackUri = currentPlayback.item.uri;
        if (delay !== 100)
          console.log(`Song not updated... trying again | timeout: ${timeout} cur time: ${Date.now() - startTime} delay: ${delay}`);
        else
        console.log(`Getting Current Playback: old url ${oldUri} new url ${newTrackUri}, date now: ${Date.now()}`);
      
      delay *= 1.3;
      await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        currentPlayback = await getCurrentEpisode();
        console.log("Playing a podcast!");
      }
    } while (newTrackUri === oldUri && Date.now() - startTime < timeout && delay < 500);

    if (newTrackUri === oldUri) {
      //sendMessageToClients({ type: 'error', data: 'Timeout reached, same song is playing' });
      throw new Error('Timeout Reached!');
    }
    let songData;
    
    if (currentPlayback.currently_playing_type === "track") {
      songData = {
        photo: null,
        duration_ms: currentPlayback.item.duration_ms,
        name: currentPlayback.item.name,
        progress_ms: currentPlayback.progress_ms,
        is_playing: currentPlayback.is_playing,
        artistName: currentPlayback.item.artists[0].name,
        uri: currentPlayback.item.uri,
        playlistUri: currentPlayback.context.uri,
        albumName: currentPlayback.item.album.name,
      };
      sendMessageToClients({ type: 'song_data', data: songData });
      const imageUrl = currentPlayback.item.album.images[0].url;
      const imageData = await getImageData(imageUrl);
      
      sendMessageToClients({ type: 'img_data', data: imageData });
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
        albumName: currentPlayback.item.show.name,
        
      };
      sendMessageToClients({ type: 'song_data', data: songData });

      sendMessageToClients({ type: 'song_data', data: songData });
      const imageUrl = currentPlayback.item.images[0].url;
      const imageData = await getImageData(imageUrl);

      sendMessageToClients({ type: 'img_data', data: imageData });
    }
    

   
  } catch (error) {
    sendError(socket, error.message);
    console.error('Error getting song data:', error);
  }
};

export {
  getCurrentPlayback,
  getCurrentDevice,
  getCurrentEpisode,
  skipToNext,
  skipToPrev,
  play,
  seek,
  pause,
  setVolume,
  returnSongData,
  setShuffle,
  setRepeat,
};

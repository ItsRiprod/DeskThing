import axios from "axios";
import { getData, setData } from "./dataHandler.js";
import open from "open";

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

  const refreshToken = getData("spotifyRefreshToken");

  if (!refreshToken) {
    try {
      await open(`http://localhost:${PORT}/login`);
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
    const response = await axios.post(TOKEN_URL, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = response.data.access_token;
    setData("spotifyToken", accessToken);
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
  console.log("There was an error");
  try {
    if (error.response) {
      if (error.response.status === 401) {
        try {
          await refreshAccessToken();
        } catch (refreshError) {
          throw new Error("Error refreshing token:", refreshError);
        }
      } else if (error.response.status === 404) {
        throw new Error('Error 404: Resource not found in handleError')
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
      console.log('MAKE REQUEST: ', method, url)
      const response = await axios({ method, url, data, headers });
      return response.data ? response.data : true;
  } catch (error) {
    await handleError(error);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait five seconds
    console.log('MAKE REQUEST: Retrying', method, url, data);
    const retryResponse = makeRequest( method, url, data );
    return retryResponse.data ? retryResponse.data : true;
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

export {
  getCurrentPlayback,
  getCurrentDevice,
  skipToNext,
  skipToPrev,
  play,
  seek,
  pause,
  setVolume,
};

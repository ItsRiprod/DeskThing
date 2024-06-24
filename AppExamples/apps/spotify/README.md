# The DeskThing ✔️
> Version 1.5 Beta



Add "Spotify" to "modules" array in `/app_config.json` to enable app
> Not on windows? [Linux Modifications](#-linux-mods)
---

## ✨What It Does

The Spotify app is the primary entry-point for any spotify-related commands. It includes a spotify-specific app on the DeskThing to view the album plus allows the media bar to work. **Highly Recommended for DeskThing functionality**

- Skip/Play/Pause/Seek tracks
- Get album art
- Get artist names
> *This is under constant development, so features will come as soon as i can make them. Suggestions welcome!*

## ▶️How It Does It

## Spotify App:

Links: 
- [Spotify App Dashboard](https://developer.spotify.com/dashboard)
- [Spotify API to get device id](https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback)

Process:
- Go to the app dashboard (linked above) and click "Create App" (You may need to enroll as a developer)
![App Creation details](/readme_images/spotify_app_creation.png)
- Get your Device ID by going to the Spotify API (linked above) and clicking "Try It"
> Ensure that you are listening to music on your primary device when you do this!
![Device ID Location](/readme_images/spotify_app_device_id.png)
- Add DEVICE_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_API_ID to `.env` file using the template in [additional resources](#-additional-resources) 
> Any Questions, Contact me via discord @riprod


---
## 📗 Additional Resources

## .env file reference
- **.env file reference for `/DeskThing/server/.env`**
```env
SPOTIFY_API_ID= /* The spotify API ID obtained from dashboard  */
SPOTIFY_CLIENT_SECRET= /* The spotify API secret obtained from dashboard */
SPOTIFY_REDIRECT_URI=http://localhost:8888/callback // The callback to go on the spotify app for auth
PORT=8888 /* The Auth0 server port for authentication */
DEVICE_ID= /* The device ID obtained from the spotify rest api */
```

- If you are running from a .bat file, this is what it should look like:
```sh
@echo off

cd /d "C:\*Path to car thing files*\carthing\DeskThing\"

set SPOTIFY_API_ID= // The API key from a spotify app obtained from the dashboard
set SPOTIFY_CLIENT_SECRET= // The spotify client secret obtained from the dashboard  
set SPOTIFY_REDIRECT_URI=http://localhost:8888/callback // this is for authenticating yourself
set PORT=8888 // Port that is used for authentication
set DEVICE_ID= // ID of your device found in the spotify REST API - optional to know where you are playing music from

# Rest of bat file
```

## 🤖 Linux Mods

Change your launch file to include the following: 
```sh
#!/bin/bash

# Change directory to the car thing files location
cd "/path/to/carthing/DeskThing/"

# Set environment variables
export SPOTIFY_API_ID= # The API key from a Spotify app obtained from the dashboard
export SPOTIFY_CLIENT_SECRET= # The Spotify client secret obtained from the dashboard  
export SPOTIFY_REDIRECT_URI=http://localhost:8888/callback # This is for authenticating yourself
export PORT=8888 # Port that is used for authentication
export DEVICE_ID= # ID of your device found in the Spotify REST API - optional to know where you are playing music from

# Rest of file
```
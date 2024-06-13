# The DeskThing ✔️
> *Just another CarThing app built off the back of superbird 🎵*

*Let's begin, shall we?*

This is the DeskThing project. Using Spotify's existing Car Thing, the DeskThing make's the perfect desk assistant. Integrating Trello API, Spotify API, AccuWeather API, and Macro capabilities, the DeskThing shoots to be *the* thing for controlling your desk environment. 

> Setup is quite intense, so be prepared!
> Not on windows? [Linux Modifications](#-linux-mods)
---

## ✨What It Does

The DeskThing is a simple CarThing Chromium-based website that can communicate with a server run on the host via ADB (on port 8891) functioning as a socket. The CarThing can:

- Skip/Play/Pause/Seek tracks
- Get album art
- Get artist names
- Get Trello workspace/boards/lists/cards
- Get the current weather (including wind speed, UVindex, AQI, etc)
- Get 12 hour forecast
- Communicate with the Novation Launchpad
- Discord call status
- And more!
> *This is under constant development, so features will come as soon as i can make them. Suggestions welcome!*

## ▶️How It Does It

### Prerequisites

1. **ADB Setup:**
   - Install ADB on your computer (Android Development).

2. **Superbird Webapp flash:**
   - Flash your CarThing with the adb enabled dump [here](https://mega.nz/folder/NxNXQCaT#-n1zkoXsJuw-5rQ-ZYzRJw) using the [superbird-tool](https://github.com/bishopdynamics/superbird-tool).
   - [detailed instructions](#-flashing)

3. **Spotify, Accuweather, Trello, and Discord apps:**
   - Set up Spotify app [detailed steps here](#spotify-app)
    - Set up a spotify app and put the required keys into the env file 
   - Set up your Trello power-up [detailed steps here](#trello-app)
    - Get app key and put it into the env file
   - Set up Accuweather app [detailed steps here](#accuweather-app)
    - Get Accuweather api key and put it into the env file
   - Set up Discord app [detailed steps here](#discord-app)
    - Get Accuweather api key and put it into the env file

### Detailed Setup Instructions

1. **Flash Your CarThing:**
   - Follow the instructions in the [superbird-tool repository](https://github.com/bishopdynamics/superbird-tool) to flash your CarThing device with the necessary image.
> If you need help, refer to the [detailed instructions](#-flashing) at the end of this page

2. **Configure Spotify App:**
   - Create a Spotify app and get the app ID and key. [Detailed steps here](#spotify-app)
   - Add your Spotify app ID and key to a `.env` file:
     ```env
     SPOTIFY_APP_ID=your_spotify_app_id
     SPOTIFY_APP_KEY=your_spotify_app_key
     SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
     DEVICE_ID=your_device_id
     ```
> at `/DeskThing/server/.env-template` there is a template env file for you to fill out. Change the name to .env once you are done
3. **Configure Trello App:**
   - Create a Trello app and get the app ID and key. [Detailed steps here](#trello-app)
   - Add your Trello app key and secret to a `.env` file: 
     ```env
     TRELLO_REDIRECT_URI=http://localhost:8888/trello/callback
     TRELLO_KEY= your_trello_key
     TRELLO_SECRET= your_trello_bot_secret
     ```
4. **Configure Accuweather App:**
   - Create a Accuweather app and get the app ID and key. [Detailed steps here](#accuweather-app)
   - Add your Accuweather app key and key to a `.env` file:
     ```env
     ACCUWEATHER_API_KEY=your_accuweather_app_api_key
     ACCUWEATHER_CITY=your_accuweather_city_id
     ```
   
5. **Configure Discord App:**
   - Create a discord app and key the key and secret. [detailed steps here](#discord-app)
   - Add them to your `.env` file:
     ```env
      DISCORD_CLIENT_ID= discord_app_id
      DISCORD_CLIENT_SECRET= discord_app_secret
      DISCORD_REDIR_URI=http://localhost:8888/discord/callback
      DISCORD_USER_ID= user_id_obtained_from_discord
     ```

6. **Configure Workspace:**
   - Use `cd ./DeskThing` to get into the project directory and run:
   ```sh
   npm install
   ```
   - Add `.env` file to `/DeskThing/server/` (optionally, just rename `.env-template` to `.env`. `.env-template` is already located where it needs to be)
   - Ensure `PORT=8888` in the `.env` file
> If anything here does not work. DM me on discord @riprod

7. **Pushing the project to the car thing:**
   - Build project:
     ```sh
     npm run build
     ```
   - Open port 8891:
     ```sh
     adb reverse tcp:8891 tcp:8891
     ```
     > adb should be an environment variable from step 1
   - Remount the build to the carthing:
     ```sh
      adb shell mount -o remount,rw /
      adb shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig
      adb shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/ # it's ok if this fails
      adb shell rm -r /tmp/webapp-orig
      adb push dist/ /usr/share/qt-superbird-app/webapp
     ```
   - Restart chromium:
     ```sh
     adb shell supervisorctl restart chromium
     ```
   - Start your server:
     ```sh
     start cmd.exe /k "node server/server.js"
     ```

---

> It's 4:04 in the morning right now. I *will* update this later.

---

Ensure that your environment is correctly set up and all dependencies are installed. Good Luck!
> Questions? DM me on discord @riprod

⚠️ *The possibility of this bricking your device is very real* ⚠️

# APP CREATION TUTORIALS

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

## Trello App

Links:
- [Trello Admin](https://trello.com/power-ups/admin/)
- [Glitch App](https://glitch.com/~trello-power-up)

Process:
- Go to the Trello Admin page and click the blue 'New' (keep this page open)
- Go to Glitch App and click 'Remix your own' (you may have to make an account)
- Once you see your project, click 'share' and then copy 'live site'
![Trello Glitch Instructions](/readme_images/trello_glitch.png)
- Go back to the Trello Admin Page and paste this link into 'iFrame connector URL'
- Fill out the rest of the information and click 'create'
- Go to the app dashboard and click 'API key' to the left (You may have to generate something here)
- Add an Allowed Origin 'http://localhost:8888' (Ensure this matches your .env callback)
![Trello API Instructions](/readme_images/trello_api.png)
- Add TRELLO_KEY and TRELLO_SECRET into your `.env` file using the template in [additional resources](#-additional-resources)

## Accuweather App

Links:
- [Accuweather Developer Dashboard](https://developer.accuweather.com/)
- [Accuweather Location API](https://developer.accuweather.com/accuweather-locations-api/apis/get/locations/v1/cities/search)

Process:
- Go to Accuweather Developer Dashboard and login
- Click 'my apps' and click '+ Add a new app'
- Fill out the information
![Accuweather Instructions](/readme_images/accuweather.png)
> Specifics here do not matter. You just need the app
- Get the API Key
![Accuweather API Instructions](/readme_images/accuweather_api.png)
- Go to accuweather location api and add your key there
![Accuweather Location Instructions](/readme_images/accuweather_location1.png)
- Get your city id

![Accuweather Location Instructions](/readme_images/accuweather_location2.png)
- Add your ACCUWEATHER_API_KEY and ACCUWEATHER_CITY (Location id) to your `.env` file using the template in [additional resources](#-additional-resources)

## Discord app

Links:
- [Discord developer dashboard](https://discord.com/developers/applications)

Process:
- Go to the developer dashboard and click 'New Application' (Name it whatever you want)
- Go to OAuth2 and generate a new secret. Match the image below:
![Discord key, secret, and redirect url](/readme_images/discord_keys.png)
> Ensure the redirect url matches the one in the `.env` file exactly
- Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to `.env` file using the template in [additional resources](#-additional-resources)
- Click 'rich presence' and add two images that have the file name 'emoji_large' and 'emoji_small'
![Discord rich presence](/readme_images/discord_status.png)
*bread for reference*
> These names must match the names in `/DeskThing/server/discordHandler.js` under the function `setActivity` largeImageKey and smallImageKey. Update this activity to whatever you want using the Visualizer

## 📸Flashing

Links:
- [image dumps](https://mega.nz/folder/NxNXQCaT#-n1zkoXsJuw-5rQ-ZYzRJw/folder/5kECGT5C)
- [superbird-tool](https://github.com/bishopdynamics/superbird-tool)

Process:
- Go to superbird-tool and install it based off your operating system. Come back once you can run `python superbird_tool.py --find_device` and see your Car Thing
- Unplug the Car Thing
- Hold buttons 1 and 4 (the four large top buttons are mapped from left to right) and plug it in.
- Wait a few seconds. If the screen does not turn on, that means you are in boot mode. You can realease the buttons
- Run `python superbird_tool.py --burn_mode` to enter burn mode
- Download 8.2.5 adb enables from image dumps (linked above) and in that same folder, also download Readme.txt
- Follow the Readme.txt to change the appropriate file names
- (Windows only) Download [zadig](https://zadig.akeo.ie/) and install the WinUSB driver for GX-CHIP (select it and click "Install Driver")
> Alternatively use libusbK if it does not work
- Run `superbird_tool.py --restore_device /path/to/extracted/firmware/folder` (This may take awhile)
- After the firmware is flashed, the Car Thing should be ready with ADB enabled. To check, run `adb shell ls -l /usr/share/qt-superbird-app/` and you should see webapp as one of the folders.
- Continue setup from [here](#detailed-setup-instructions)

---
## 📗 Additional Resources

- 🔧 [superbird-tool](https://github.com/bishopdynamics/superbird-tool) - This is the CarThing image that is being used. Be sure to either include this link or steps on how to flash the CarThing.
- 🐤 [superbird-custom-webapp](https://github.com/pajowu/superbird-custom-webapp/tree/main) - The React web app framework that this project started with.
- 🗨️ [Car Thing Hax Community Discord](https://discord.gg/aPSV6NykA6) - The discord where there is this project and so much more!

## .env file reference
- **.env file reference for `/DeskThing/server/.env`**
```env
SPOTIFY_API_ID= /* The spotify API ID obtained from dashboard  */
SPOTIFY_CLIENT_SECRET= /* The spotify API secret obtained from dashboard */
SPOTIFY_REDIRECT_URI=http://localhost:8888/callback // The callback to go on the spotify app for auth
PORT=8888 /* The Auth0 server port for authentication */
DEVICE_ID= /* The device ID obtained from the spotify rest api */
TRELLO_REDIRECT_URI=http://localhost:8888/trello/callback
TRELLO_KEY= // Trello bot key
TRELLO_SECRET= // Trello bot secret
ACCUWEATHER_API_KEY= // Key obtained from AccuWeather app
ACCUWEATHER_CITY= // City key obtained from AccuWeather api
DISCORD_CLIENT_ID= # Discord bot ID
DISCORD_CLIENT_SECRET= # Discord bot Secret
DISCORD_REDIR_URI=http://localhost:8888/discord/callback
DISCORD_USER_ID= # Discord user id (yours)
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

set TRELLO_TOKEN= // Trello bot token
set TRELLO_KEY= // Trello bot key
set TRELLO_SECRET= // Trello bot secret
set ACCUWEATHER_API_KEY= // Key obtained from AccuWeather app
set ACCUWEATHER_CITY= // City key obtained from AccuWeather app

set DISCORD_CLIENT_ID= // Discord bot id
set DISCORD_CLIENT_SECRET= // Discord bot secret
set DISCORD_REDIR_URI=http://localhost:8888/discord/callback
set DISCORD_USER_ID= // Your user ID

adb reverse tcp:8891 tcp:8891
adb shell mount -o remount,rw /
adb shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig
adb shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/ # it's ok if this fails
adb shell rm -r /tmp/webapp-orig
adb push dist/ /usr/share/qt-superbird-app/webapp

start cmd.exe /k "node server/server.js"
```

## 🤖 Linux Mods

Currently, DeskThing does not have great support for linux. This will be resolved once DeskThing becomes modular, but for now you can do the following steps:
- Follow superbird-tool tutorial for flashing the car thing with the ADB_ENABLES flash
- Ensure ADB is installed correctly
- run `npm uninstall midi robotsjs`
- in `/server/socketHandler.js` remove any mention of robotsjs
- in `/server/server.js` remove the import statement for the launchpadHandler.js
> I don't run linux - so if there are any more incompatibilites, DM me on discord @riprod so I can add them here
- Run the following script (After obtaining env files):
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

export TRELLO_TOKEN= # Trello bot token
export TRELLO_KEY= # Trello bot key
export TRELLO_SECRET= # Trello bot secret
export ACCUWEATHER_API_KEY= # Key obtained from AccuWeather app
export ACCUWEATHER_CITY= # City key obtained from AccuWeather app

export DISCORD_CLIENT_ID= # Discord bot id
export DISCORD_CLIENT_SECRET= # Discord bot secret
export DISCORD_REDIR_URI=http://localhost:8888/discord/callback
export DISCORD_USER_ID= # Your user ID

# Use adb to reverse ports and move files
adb reverse tcp:8891 tcp:8891
adb shell mount -o remount,rw /
adb shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig
adb shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/ # it's ok if this fails
adb shell rm -r /tmp/webapp-orig
adb push dist/ /usr/share/qt-superbird-app/webapp

# Start the server
node server/server.js
```

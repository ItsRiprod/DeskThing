# CarThing TODOThing

Just another CarThing app built off the back of superbird

*So let's begin*
This is the TODOThing project. Using Spotify's existing Car Thing, the TODOThing make's the perfect desk assistant. Integrating Trello API, Spotify API, AccuWeather API, and Macro capabilities, the TODOThing shoots to be *the* thing for controlling your desk environment. 

Setup is quite intense, so be prepared!

---

## What It Does

The TODOThing is a simple CarThing Chromium-based website that can communicate with a server run on the host via ADB (on port 8891) functioning as a socket. The CarThing can:

- Skip/Play/Pause/Seek tracks
- Get album art
- Get artist names
- Get Trello workspace/boards/lists/cards
- Get the current weather (including wind speed, UVindex, AQI, etc)
- Get 12 hour forecast
- Communicate with the Novation Launchpad (optional)
- And more! (This is under constant development, so features will come as soon as i can make them. Suggestions welcome!)

## How It Does It

### Prerequisites

1. **ADB Setup:**
   - Install ADB on your computer (Android Development).

2. **Superbird Webapp flash:**
   - Flash your CarThing with the adb enabled dump [here](https://mega.nz/folder/NxNXQCaT#-n1zkoXsJuw-5rQ-ZYzRJw) using the [superbird-tool](https://github.com/bishopdynamics/superbird-tool).

3. **Spotify, Accuweather, and Trello Integration:**
   - Set up Spotify app
    - Set up a spotify app and put the required keys into the env file 
   - Set up your Trello power-up
    - Get app key and put it into the env file
   - Set up Accuweather app
    - Get Accuweather api key and put it into the env file

### Detailed Setup Instructions

1. **Flash Your CarThing:**
   - Follow the instructions in the [superbird-tool repository](https://github.com/bishopdynamics/superbird-tool) to flash your CarThing device with the necessary image.

2. **Configure Spotify App:**
   - Create a Spotify app and get the app ID and key. Detailed steps can be found [here](https://developer.spotify.com/documentation/web-api/quick-start/).
   - Add your Spotify app ID and key to a `.env` file:
     ```
     SPOTIFY_APP_ID=your_spotify_app_id
     SPOTIFY_APP_KEY=your_spotify_app_key
     ```
3. **Configure Trello App:**
   - Create a Trello app and get the app ID and key. Detailed steps can be found [here](https://developer.atlassian.com/cloud/trello/guides/power-ups/your-first-power-up/).
   - Add your Trello app key and secret to a `.env` file:
     ```
     TRELLO_REDIRECT_URI=http://localhost:8888/trello/callback
     TRELLO_KEY= your_trello_key
     TRELLO_SECRET= your_trello_bot_secret
     ```
4. **Configure Accuweather App:**
   - Create a Accuweather app and get the app ID and key. Detailed steps can be found [here](https://developer.accuweather.com/).
   - Add your Accuweather app key and key to a `.env` file:
     ```
     ACCUWEATHER_API_KEY=your_accuweather_app_api_key
     ```

5. **Find Your Computer ID (Optional):**
   - Use the Spotify REST API to find your computer ID. Refer to the [Spotify REST API documentation](https://developer.spotify.com/documentation/web-api/reference/#/operations/get-information-about-the-users-current-playback) for detailed instructions.

6. **Establish Communication:**
   - Build project:
     ```
     npm run build
     ```
   - Open port 8891:
     ```
     adb reverse tcp:8891 tcp:8891
     ```
   - Remount the build to the carthing:
     ```
     adb shell "mountpoint /usr/share/qt-superbird-app/webapp/ > /dev/null && umount /usr/share/qt-superbird-app/webapp"
     adb shell "rm -rf /tmp/webapp"
     adb push "build/" /tmp/webapp
     adb shell "mount --bind /tmp/webapp /usr/share/qt-superbird-app/webapp"
     ```
   - Restart chromium:
     ```
     adb shell supervisorctl restart chromium
     ```
   - Start your server:
     ```
     start cmd.exe /k "node server/server.js"
     ```

---

It's 4:04 in the morning right now. I *will* update this later.

---

### Additional Resources

- [superbird-tool](https://github.com/bishopdynamics/superbird-tool) - This is the CarThing image that is being used. Be sure to either include this link or steps on how to flash the CarThing.
- [superbird-custom-webapp](https://github.com/pajowu/superbird-custom-webapp/tree/main) - The React web app framework that this project started with.

.env file reference for /TODOThing/server/.env
```
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
```

If you are running from a .bat file, this is what it should look like:
```
@echo off

cd /d "C:\*Path to car thing files*\carthing\TODOThing\"

set SPOTIFY_API_ID= // The API key from a spotify app obtained from the dashboard
set SPOTIFY_CLIENT_SECRET= // The spotify client secret obtained from the dashboard  
set SPOTIFY_REDIRECT_URI=http://localhost:8888/callback // this is for authenticating yourself
set PORT=8888 // Port that is used for authentication
set DEVICE_ID= // ID of your device found in the spotify REST API - optional to know where you are playing music from
set TRELLO_TOKEN= // Trello bot token
set TRELLO_KEY= // Trello bot key
set TRELLO_SECRET= // Trello bot secret
set ACCUWEATHER_API_KEY= // Key obtained from AccuWeather app
set ACCUWEATHER_CITY=

adb reverse tcp:8891 tcp:8891
adb shell "mountpoint /usr/share/qt-superbird-app/webapp/ > /dev/null && umount /usr/share/qt-superbird-app/webapp"
adb shell "rm -rf /tmp/webapp"
adb push "build/" /tmp/webapp
adb shell "mount --bind /tmp/webapp /usr/share/qt-superbird-app/webapp"
adb shell supervisorctl restart chromium

start cmd.exe /k "node server/server.js"
```

---

Ensure that your environment is correctly set up and all dependencies are installed. Good Luck!


*The possibility of this bricking your device is very real - every step of this process is risky and i would do so with extreme caution.*
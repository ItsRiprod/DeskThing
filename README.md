# The DeskThing ✔️
> *Just another CarThing app built off the back of superbird 🎵*

*Let's begin, shall we?*

This is the DeskThing project. Using Spotify's existing Car Thing, the DeskThing make's the perfect desk assistant. Integrating Trello API, Spotify API, AccuWeather API, and Macro capabilities, the DeskThing shoots to be *the* thing for controlling your desk environment. 
> ⚠️⚠️⚠️ POTENTIALLY OUTDATED ⚠️⚠️⚠️ There were recent changes made to make it more modular! Now, modify `app_config.json` under /server/ to add/remove which apps you want to include! Only set up the apps that you need and the rest will be handled by the program

> Setup is quite intense, so be prepared!
> Not on windows? [Linux Modifications](#-linux-mods)
---

## ✨What It Does

The DeskThing is a simple CarThing Chromium-based website that can communicate with a server run on the host via ADB (on port 8891) functioning as a socket. The CarThing can:

- Spotify Integration
   - Show currently listening (Album, Artist, Song name, album art)
   - Control Spotify (Skip, pause, play, rewind, shuffle, repeat)
   - Supports Podcasts too!
   - Spotify app [installation instructions here](https://github.com/ItsRiprod/carthing/tree/main/DeskThing/server/apps/spotify#spotify-app-install)
- Discord Integration
   - Show current call status (Participants, who's talking, their mute status)
   - Control Discord (~~Mute/Unmute  Deafen//Undeafen Disconnect~~)
   - ~~Control Individual User Volume~~
   - ~~See message preview~~
   - Discord app [installation instructions here](https://github.com/ItsRiprod/carthing/tree/main/DeskThing/server/apps/discord#discord-app-install)
- Weather Integration
   - Show local weather
   - Temperature
   - AQI, UV Index, Wind Speed + Direction, Visibility
   - 12 Hour forecast
   - Weather app [installation instructions here](https://github.com/ItsRiprod/carthing/tree/main/DeskThing/server/apps/weather#weather-app-install)
- Audible Integration
   - ~~Currently Listening To~~ 
   - ~~Audio Controls (Skip, Rewind, Fast Forward)~~ 
   - ~~Audio Status (%through)~~
   - Audiobook library
   - Audiobook stats (Progress, Length of book, time left, ASIN)
   - Audible app [installation instructions here](/server/apps/audible#audible-app-install)
- Launchpad Integration
   - Control different views on your launchpad!
   - Show your system resource usage on your novation launchpad
   - Add timers from your launchpad
   - ~~Show weather from launchpad~~
   - ~~Show time on launchpad~~
   - ~~Trigger macros from launchpad~~
   - Launchpad app [installation instructions here](/server/apps/launchpad#launchpad-app-install)
- Trello Integration
   - See all organizations 
   - See all boards 
   - See all lists 
   - See all cards 
   - See all tags 
   - Set different lists as your favorites 
   - Trello app [installation instructions here](/server/apps/trello#trello-app-install)
     
> *This is under constant development, so features will come as soon as I can make them. Suggestions welcome!*

## ▶️How It Does It

### Prerequisites

1. **ADB Setup:**
   - Install ADB on your computer (Android Development).

2. **Superbird Webapp flash:**
   - Flash your CarThing with the adb_enabled dump [here](https://mega.nz/folder/NxNXQCaT#-n1zkoXsJuw-5rQ-ZYzRJw) using the [superbird-tool](https://github.com/bishopdynamics/superbird-tool).
   - [detailed instructions](#flashing)

### Detailed Setup Instructions

1. **Flash Your CarThing:**
   - Follow the instructions in the [superbird-tool repository](https://github.com/bishopdynamics/superbird-tool) to flash your CarThing device with the necessary image.
> If you need help, refer to the [detailed instructions](#flashing) at the end of this page

2. **Configure Apps You Want To Include:**
   - Spotify app [installation instructions here](/server/apps/spotify#spotify-app-install)
   - Trello app [installation instructions here](/server/apps/trello#trello-app-install)
   - Weather app [installation instructions here](/server/apps/weather#weather-app-install)
   - Launchpad app [installation instructions here](/server/apps/launchpad#launchpad-app-install)
   - Discord app [installation instructions here](/server/apps/discord#discord-app-install)
   - Audible app [installation instructions here](/server/apps/audible#audible-app-install)

3. **Configure Workspace:**
   - Use `cd ./DeskThing` to get into the project directory and run:
   ```sh
   npm install
   ```
   - Add `.env` file to `/DeskThing/server/` (optionally, just rename `.env-template` to `.env`. `.env-template` is already located where it needs to be)
   - Ensure `PORT=8888` in the `.env` file
> If anything here does not work. DM me on discord @riprod

4. **Pushing the project to the car thing:**
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

adb shell supervisorctl restart chromium

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
adb shell supervisorctl restart chromium

# Start the server
node server/server.js
```

### Discord Flatpak work around

If you are encountering an error `reject(new Error('Could not connect'));` then try the following found [here](https://github.com/flathub/com.discordapp.Discord/wiki/Rich-Precense-(discord-rpc))

Run the following:
```sh
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

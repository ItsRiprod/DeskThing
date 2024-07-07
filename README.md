![App Creation details](/readme_images/deskthing-banner.png)

# The DeskThing ✔️

*Let's begin, shall we?*

This is the DeskThing project. Using Spotify's existing Car Thing, the DeskThing makes the perfect desk assistant. Integrating Trello API, Spotify API, AccuWeather API, and Macro capabilities, the DeskThing shoots to be *the* thing for controlling your desk environment. 

**⚠️DO NOT PULL MAIN BRANCH ⚠️**

Instead, go to [Releases](https://github.com/ItsRiprod/DeskThing/releases) and download the .zip file for v0.5.*-alpha (which this readme follows) and use that

---

<details>
   <summary><h2>✨ Features</h2></summary>

The DeskThing is a simple CarThing Chromium-based website that can communicate with a server run on the host via ADB (on port 8891) functioning as a socket. The CarThing can:

- ### Spotify Integration 🎧
   - [X] Show currently listening (Album, Artist, Song name, album art)
   - [X] Control Spotify (Skip, pause, play, rewind, shuffle, repeat)
   - [X] Supports Podcasts too!
   - Spotify app [installation instructions here](/DeskThing/server/apps/spotify#spotify-app-install)
- ### Dasktop Now Playing (Only Windows) 🎧
   - [X] Show currently listening (Album, Artist, Song name, album art)
   - [X] Control the current media (Skip, pause, play, rewind, shuffle, repeat)
   - *no setup instructions yet. Drag-n-drop the .zip from /releases/apps/ into the GUI*
- ### ~~Discord Integration 💬~~ *to be migrated*
   - [X] Show current call status (Participants, who's talking, their mute status)
   - [ ] ~~Control Discord (Mute/Unmute  Deafen//Undeafen Disconnect)~~
   - [ ] ~~Control Individual User Volume~~
   - [ ] ~~See message preview~~
   - Discord app [installation instructions here](/DeskThing/server/apps/discord#discord-app-install)
- ### Weather Integration 🌧️ *to be migrated*
   - [X] Show local weather
   - [X] Temperature
   - [X] AQI, UV Index, Wind Speed + Direction, Visibility
   - [X] 12 Hour forecast
   - Weather app [installation instructions here](/DeskThing/server/apps/weather#weather-app-install)
- ### ~~Audible Integration📗~~ *to be migrated*
   - [ ] ~~Currently Listening To~~ 
   - [ ] ~~Audio Controls (Skip, Rewind, Fast Forward)~~ 
   - [ ] ~~Audio Status (%through)~~
   - [X] Audiobook library
   - [X] Audiobook stats (Progress, Length of book, time left, ASIN)
   - Audible app [installation instructions here](/DeskThing/server/apps/audible#audible-app-install)
- ### ~~Launchpad Integration 🎵~~ *to be migrated*
   - [X] Control different views on your launchpad!
   - [X] Show your system resource usage on your novation launchpad
   - [X] Add timers from your launchpad
   - [ ] ~~Show weather from launchpad~~
   - [ ] ~~Show time on launchpad~~
   - [ ] ~~Trigger macros from launchpad~~
   - [ ] Launchpad app [installation instructions here](/DeskThing/server/apps/launchpad#launchpad-app-install)
- ### ~~Trello Integration 📃~~ *to be migrated*
   - [X] See all organizations 
   - [X] See all boards 
   - [X] See all lists 
   - [X] See all cards 
   - [X] See all tags 
   - [X] Set different lists as your favorites 
   - Trello app [installation instructions here](/DeskThing/server/apps/trello#trello-app-install)
<details>
   <summary>
      <h3>Planned Apps</h3>
   </summary>

- Macropad / Streamdeck
- GUI Companion
- Dashboard/Settings for config changes
- General audio control
- Advanced Spotify Stats
- Home Assistant
- And more!
</details>

> *This is under constant development, so features will come as soon as I can make them. Suggestions welcome!*
</details> 

---

<details>
   <summary>
      <h2>▶️ Setting Up</h2>
   </summary>

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

*You do not need the .env file on versions at or later than v0.5.0 due to the apps requesting the keys. Still reference the tutorials for obtaining the needed information when loading an app*
   - Spotify app [installation instructions here](/DeskThing/server/apps/spotify#spotify-app-install)
   - Trello app [installation instructions here](/DeskThing/server/apps/trello#trello-app-install)
   - Weather app [installation instructions here](/DeskThing/server/apps/weather#weather-app-install)
   - Launchpad app [installation instructions here](/DeskThing/server/apps/launchpad#launchpad-app-install)
   - Discord app [installation instructions here](/DeskThing/server/apps/discord#discord-app-install)
   - Audible app [installation instructions here](/DeskThing/server/apps/audible#audible-app-install)

3. **Configure Workspace:**
   - Use `cd ./DeskThing` to get into the project directory and run:
   ```sh
   npm install
   ```
   - ~~Add `.env` file to `/DeskThing/server/` (optionally, just rename `.env-template` to `.env`. `.env-template` is already located where it needs to be)~~
   - ~~Ensure `PORT=8888` in the `.env` file~~ *Not required on versions later than v0.5.0*
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
</details>

---

<details>
   <summary>
      <h2>📸Flashing</h2>
   </summary>

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

</details>

---

## 📗 Additional Resources

- 🔧 [superbird-tool](https://github.com/bishopdynamics/superbird-tool) - This is the CarThing image that is being used. Be sure to either include this link or steps on how to flash the CarThing.
- 🐤 [superbird-custom-webapp](https://github.com/pajowu/superbird-custom-webapp/tree/main) - The React web app framework that this project started with.
- 🗨️ [Car Thing Hax Community Discord](https://discord.gg/aPSV6NykA6) - The discord where there is this project and so much more!

---

<details>
<summary>
   <h2>Running the WebApp</h2>
</summary>

- If you are running from a .bat file, this is what it should look like:

```sh
@echo off

cd /d "C:\*Path to car thing files*\carthing\DeskThing\"

adb reverse tcp:8891 tcp:8891
adb shell mount -o remount,rw /
adb shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig
adb shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/ # it's ok if this fails
adb shell rm -r /tmp/webapp-orig
adb push dist/ /usr/share/qt-superbird-app/webapp

adb shell supervisorctl restart chromium
```

</details>

---


> Questions? DM me on discord @riprod

⚠️ *The possibility of this bricking your device is very real* ⚠️

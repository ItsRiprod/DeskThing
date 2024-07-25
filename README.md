![App Creation details](/readme_images/deskthing-banner.png)

*Logo design and artwork by @Dilango*

# The DeskThing ✔️

*Let's begin, shall we?*

This is the DeskThing project. Using Spotify's existing Car Thing, the DeskThing makes the perfect desk assistant. Integrating Trello API, Spotify API, AccuWeather API, and Macro capabilities, the DeskThing shoots to be *the* thing for controlling your desk environment. 

**⚠️DO NOT PULL MAIN BRANCH ⚠️**

Instead, go to [Releases](https://github.com/ItsRiprod/DeskThing/releases) and download the installer for your OS and all the apps

---
> All instructions are up-to-date as late of v0.5.4-alpha. Later versions may differ in functionality and setup
<details>
   <summary><h2>✨ Features</h2></summary>

The DeskThing is a simple CarThing Chromium-based website that can communicate with a server run on the host via ADB (on port 8891) functioning as a socket. The CarThing can:

- ### Spotify Integration 🎧
   - [X] Show currently listening (Album, Artist, Song name, album art)
   - [X] Control Spotify (Skip, pause, play, rewind, shuffle, repeat)
   - [X] Supports Podcasts too!
   - [X] Set Audio Output Source
   - Spotify app [installation instructions here](/DeskThing/server/apps/spotify#spotify-app-install)
- ### Desktop Now Playing (Only Windows) 🎧
   - [X] Show currently listening (Album, Artist, Song name, album art)
   - [X] Control the current media (Skip, pause, play, rewind, shuffle, repeat)
   - *no setup instructions yet. Drag-n-drop the .zip from /releases/apps/ into the GUI*
- ### ~~Discord Integration 💬~~ *to be migrated*
   - [X] Show current call status (Participants, who's talking, their mute status)
   - [ ] ~~Control Discord (Mute/Unmute  Deafen//Undeafen Disconnect)~~
   - [ ] ~~Control Individual User Volume~~
   - [ ] ~~See message preview~~
   - Discord app [installation instructions here](/DeskThing/server/apps/discord#discord-app-install)
- ### Weather Integration 🌧️
   - [X] Show local weather
   - [X] Temperature
   - [X] AQI, UV Index, Wind Speed + Direction, Visibility
   - [X] 12 Hour forecast
   - Weather app [installation instructions here](/DeskThing/server/apps/weather#weather-app-install)
- ### ~~Audible Integration📗~~ *to be migrated*
   - [ ] ~~Currently Listening To~~ 
   - [ ] ~~Audio Controls (Skip, Rewind, Fast Forward)~~ 
   - [ ] ~~Audio Status (%through)~~
   - [X] Audiobook Library
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
- Pomodoro Timer
- Google Calendar
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
   - Flash your CarThing with the adb_enabled dump [here](https://mega.nz/folder/NxNXQCaT#-n1zkoXsJuw-5rQ-ZYzRJw/folder/Ak9FVKxJ) using the [superbird-tool](https://github.com/Car-Thing-Hax-Community/superbird-tool).
   - [detailed instructions](#flashing)

### Detailed Setup Instructions

1. **Flash Your CarThing:**
   - Follow the instructions in the [superbird-tool repository](https://github.com/Car-Thing-Hax-Community/superbird-tool) to flash your CarThing device with the necessary image.
> If you need help, refer to the [detailed instructions](#flashing) at the end of this page

2. **Get the installer**
*should be under [releases](https://github.com/ItsRiprod/DeskThing/releases)*

   - Run the 'deskthing-0.5.5-*-setup.*' installer on your computer

3. **Check for your device:**
   - Under the 'Status' tab in v0.5.5 or earlier or 'ADB' tab in v0.5.6 or later, ensure your device shows up. If it does not, join the Discord server and report the issue, this can be buggy on some machines.
> A few things to try if it isn't working is to 1: Use task manager to kill all instances of ADB 2: Run DeskThing as administrator 3: Unplug and plug in your Car thing 4: Install ADB and manually check with `adb devices`
   - If the device shows up, go to the 'Webapps' tab and click the latest version (Only use the ADB version if RNDIS doesn't work)
   - Go back to the 'Devices' tab and click 'Push Staged Webapp' It should take a second, and then your Car Thing should restart.
4. **Load Apps**
   - Congrats! You're basically done. Now go to 'Apps' and then 'Webapps' and download any apps you want. Ensure you check dependencies before doing so as this could cause errors. 

> Any Issues? Contact me [through the CarThingHax discord server](https://discord.carth.ing/) or via DMs to @riprod

</details>

---

<details>
   <summary>
      <h2>📸Flashing</h2>
   </summary>

Links:
- [image dumps](https://mega.nz/folder/NxNXQCaT#-n1zkoXsJuw-5rQ-ZYzRJw/folder/Ak9FVKxJ)
> Ensure you download one with ADB and RNDIS enabled (any one of the 'new' ones work) 8.4.4_adb_enabled-new.tar.xz is the current best
- [superbird-tool](https://github.com/Car-Thing-Hax-Community/superbird-tool)

Process:
- Go to superbird-tool and install it based off your operating system. Come back once you can run `python superbird_tool.py --find_device` and see your Car Thing
- Unplug the Car Thing
- Hold buttons 1 and 4 (the four large top buttons are mapped from left to right) and plug it in.
- Wait a few seconds. If the screen does not turn on, that means you are in boot mode. You can release the buttons
- Run `python superbird_tool.py --burn_mode` to enter burn mode
> Note: This step may say it fails to enter burn mode. This is okay, continue on as if it worked. There is information in the discord as to why this is.
- Download 8.4.4_adb_enabled-new.tar.xz files from image dumps (linked above) and in that same folder (unzip them)
- (Windows only) Download [zadig](https://zadig.akeo.ie/) and install the WinUSB driver for **GX-CHIP** (select it and click "Install Driver")
> Alternatively use **libusbK** if it does not work
- Run `superbird_tool.py --restore_device /path/to/extracted/firmware/folder` (This may take a while)
- After the firmware is flashed, the Car Thing should be ready with ADB enabled. To check, run `adb shell ls -l /usr/share/qt-superbird-app/` and you should see webapp as one of the folders.
- Ensure that `adb devices` works and registers `12345 device` as one of the options
- Continue setup from [here](#detailed-setup-instructions)

</details>

---

## 📗 Additional Resources

- 🔧 [superbird-tool](https://github.com/Car-Thing-Hax-Community/superbird-tool) - This is the CarThing image that is being used. Be sure to either include this link or steps on how to flash the CarThing.
- 🐤 [superbird-custom-webapp](https://github.com/pajowu/superbird-custom-webapp/tree/main) - The React web app framework that this project started with.
- 🗨️ [Car Thing Hax Community Discord](https://discord.carth.ing/) - The discord where there is this project and so much more!


---


> Questions? DM me on discord @riprod

⚠️ *The possibility of this bricking your device is very real* ⚠️

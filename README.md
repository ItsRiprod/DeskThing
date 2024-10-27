 ![Deskthing Banner](/readme_images/deskthing-banner.png)

*Logo design and artwork by @Dilango*

 > ❔[Reddit Link](https://reddit.com/r/DeskThing)

 > 📃[Trello Board](https://trello.com/b/6v0paxqV/deskthing)

 > 💬[Deskthing Discord](https://discord.gg/uNS3dhj46D)

 > 🌐[Official Deskthing Website](https://deskthing.app)

 > 📺 [Deskthing Youtube Channel](https://www.youtube.com/@DeskThing)
 
 > 💬 [Car Thing Hax Community Discord](https://discord.carth.ing/)

# The DeskThing ✔️

*Let's begin, shall we?*

This is the DeskThing project. Using Spotify's existing Car Thing, the DeskThing makes the perfect desk assistant. Integrating Trello API, Spotify API, AccuWeather API, and Macro capabilities, the DeskThing shoots to be *the* thing for controlling your desk environment. 

**⚠️DO NOT PULL MAIN BRANCH ⚠️**

Instead, go to [The Official Website](https://deskthing.app/) and download the installer for your OS
For a video walkthrough of v0.6.0, go to [this video](https://youtu.be/nC65O1nP-pk?si=dxUEF6wyzLI2Z72U)

---
> All instructions are up-to-date as late of v0.8.0-beta. Later versions may differ in functionality and setup
<details>
   <summary><h2>✨ Features</h2></summary>

<img src="readme_images/bar.svg" style="width: 100%;" alt="Click to see the source">

The DeskThing is a simple CarThing Chromium-based website that can communicate with a Desktop APP on your computer. The CarThing can:

- ### All In One Package 📦
   - [X] Download apps directly from the Desktop App GUI
   - [X] Manage and update the Car Thing's display
   - [X] Probably more - just check it out already
- ### Configurable Controls ⚙️
   - [X] Make any button do any function!
   - [X] Control audio with the top buttons, front buttons, back buttons, really whatever you want!
   - [X] Modify them from the Desktop UI
   - [X] Add more directly from apps! (Basically, you can do anything)
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
- ### Discord Integration 💬
   - [X] Show current call status (Participants, who's talking, their mute status)
   - [X] Control Discord (Mute/Unmute  Deafen/Undeafen Disconnect)
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

<img src="readme_images/bar.svg" style="width: 100%;" alt="Click to see the source">

- Macropad / Streamdeck
- GUI Companion
- Dashboard/Settings for config changes
- General audio control
- Advanced Spotify Stats
- Home Assistant
- Pomodoro Timer
- Google Calendar
- More details in the [Trello Board](https://trello.com/b/6v0paxqV/deskthing)
</details>

> *This is under constant development, so features will come as soon as I can make them. Suggestions welcome!*
</details> 

---

<details>
   <summary>
      <h2>▶️ Setting Up</h2>
   </summary>

<img src="readme_images/bar.svg" style="width: 100%;" alt="Click to see the source">

### Detailed Setup Instructions

‼️ There is now a youtube tutorial walking through this process ‼️

[Setting up to v0.6.0 that shows how to flash](https://youtu.be/nC65O1nP-pk?si=umjOsybdfmQud6I0)

[Upgrading to v0.8.0 from 0.6.0](https://www.youtube.com/watch?v=Exu7KMcbN4k)

*Step-by-step instructions*

1. **Flash Your CarThing:**
   - Follow the instructions in the [superbird-tool repository](https://github.com/Car-Thing-Hax-Community/superbird-tool) to flash your CarThing device with the necessary image.
> If you need help, refer to the [detailed instructions](#flashing) at the end of this page

2. **Get the installer**
*should be under [releases](https://github.com/ItsRiprod/DeskThing/releases)*

   - Run the 'deskthing-0.*.*-*-setup.*' installer on your computer

3. **Check for your device:**
   - Under the 'Devices' tab, ensure your device shows up. If it does not, join the Discord server and report the issue, this can be buggy on some machines.
> A few things to try if it isn't working is to 1: Use task manager to kill all instances of ADB 2: Run DeskThing as administrator 3: Unplug and plug in your Car thing 4: Install ADB and manually check with `adb devices`
   - If the device shows up, go to the 'Client Downloads' tab and click the latest version. It should show up at the top (Staged: Deskthing CLient)
   - Go back to the 'Devices' tab and click 'Push Staged Webapp' It should take a second, and then your Car Thing should restart.
4. **Load Apps**
   - Congrats! You're basically done. Now go to 'Apps' and then 'Webapps' and download any apps you want. Ensure you check dependencies before doing so as this could cause errors. 

> Any Issues? Contact me [through the Deskthing discord server](https://discord.gg/qWbSwzWJ4e) or via DMs to @riprod

⚠️Note for MacOS⚠️

First, when you install the DeskThing installer, you'll need to run
```
sudo xattr -r -d com.apple.quarantine DeskThing.app
```
to fix the app. Otherwise it'll say it's corrupted or something

Because ADB on the car thing and MacOS is funky, you need to run this on the DeskThing's ADB
```
chmod +x /Applications/DeskThing.app/Contents/Resources/mac/adb
```

Finally, the image linked above won't always work for MacOS. So instead, use the following image (it is a discord download for now) as it fixes ADB for MacOS

**Go to Releases -> MACOS LISTEN UP to find the updated link**
*Discord will cycle the url for the link so this one will expire after a given amnt of time*
[https://cdn.discordapp.com/attachments/1243762430631481395/1272624114766577845/8.4.4_adb_enabled-new.tar.xz?ex=66cad051&is=66c97ed1&hm=befb7c49b203d752dbb9f4986377ea0be8fcde4f9f2db874de7c62a668bbd046&](https://cdn.discordapp.com/attachments/1243762430631481395/1272624114766577845/8.4.4_adb_enabled-new.tar.xz?ex=671e8791&is=671d3611&hm=625ec81558151de46c488343d54dc4bc50b03a4a6d9ee786b82b619c1b270ed3&)

Thanks! Have a good day

</details>

---

<details>
   <summary>
      <h2>📸Flashing</h2>
   </summary>

<img src="readme_images/bar.svg" style="width: 100%;" alt="Click to see the source">

Links:
- [image dumps](https://mega.nz/folder/NxNXQCaT#-n1zkoXsJuw-5rQ-ZYzRJw/folder/Ak9FVKxJ)
> Ensure you download one with ADB and RNDIS enabled (any one of the '-new' ones work) 8.4.4_adb_enabled-new.tar.xz is the current best option
- [superbird-tool](https://github.com/Car-Thing-Hax-Community/superbird-tool)

Alternative image dump [here](https://mega.nz/file/RptVUAZT#K__JkdCRWDgC3sVSA64YDBsskOTiZXy1_XBhuVNOmFA) if the first one doesnt work
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
- Run `python superbird_tool.py --restore_device /path/to/extracted/firmware/folder` (This may take a while)
- After the firmware is flashed, the Car Thing should be ready with ADB enabled. To check, run `adb shell ls -l /usr/share/qt-superbird-app/` and you should see webapp as one of the folders.
- Ensure that `adb devices` works and registers `whateveryouridis device` as one of the options
- Continue setup from [here](#detailed-setup-instructions)

</details>

---

## 📗 Additional Resources

- 🔧 [superbird-tool](https://github.com/Car-Thing-Hax-Community/superbird-tool) - This is the CarThing image that is being used. Be sure to either include this link or steps on how to flash the CarThing.
- 🐤 [superbird-custom-webapp](https://github.com/pajowu/superbird-custom-webapp/tree/main) - The React web app framework that this project started with.
- 🗨️ [Car Thing Hax Community Discord](https://discord.carth.ing/) - The discord where there is this project and so much more!


---


> Questions? DM me on discord @riprod

⚠️ *While bricking the Car Thing is extremely difficult - I don't think anyone has done it yet - the possibility is still there. I do not take any responsibility for damages done to the device. Try to use common sense* ⚠️


# Developing Apps
Interested in developing an app? Well here's a great place to start! Make sure you join the DeskThing discord server so I, or anyone else, can help you out!

Start with
```sh
npm create deskthing@latest
```
And follow the prompts to set up the app environment. From there, you can reference:

*The template itself*
https://github.com/ItsRiprod/deskthing-template

*The app-side connector*
https://github.com/ItsRiprod/deskthing-app-client

*The server-side connector*
https://github.com/ItsRiprod/deskthing-app-server

*The client that goes on the Car Thing*
https://github.com/ItsRiprod/deskthing-client

*App References*
https://github.com/ItsRiprod/deskthing-apps

Good luck!

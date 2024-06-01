# CarThing TODOThing

This is THE repo where I will be building my CarThing app with Vite.

## Built off the Backs of Giants

This is the CarThing TODOThing project. It integrates with Trello while still allowing you to control your Spotify music. *trello integration pending...*

Setup is quite intense, so be prepared!

---

## What It Does

The TODOThing is a simple CarThing Chrome-based website that can communicate with a server run on the host via ADB (on port 8891) functioning as a socket. The CarThing can:

- Skip tracks
- Get album art
- Get artist names
- Perform all basic Spotify player functionalities

## How It Does It

### Prerequisites

1. **ADB Setup:**
   - Install ADB on your computer (Android Development).
   - Flash your CarThing with the web app using the [superbird-tool](https://github.com/bishopdynamics/superbird-tool).

2. **React Project:**
   - Build the React projects from the [superbird-custom-webapp framework](https://github.com/pajowu/superbird-custom-webapp/tree/main).

3. **Spotify and Trello Integration:**
   - Obtain your Spotify authentication key. You should be prompted when you launch the app.
   - Set up your Trello power-up.

### Detailed Setup Instructions

1. **Flash Your CarThing:**
   - Follow the instructions in the [superbird-tool repository](https://github.com/bishopdynamics/superbird-tool) to flash your CarThing device with the necessary image.

2. **Build React Projects:**
   - Clone and build the React projects from [superbird-custom-webapp](https://github.com/pajowu/superbird-custom-webapp/tree/main).

3. **Configure Spotify App:**
   - Create a Spotify app and get the app ID and key. Detailed steps can be found [here](https://developer.spotify.com/documentation/web-api/quick-start/).
   - Add your Spotify app ID and key to a `.env` file:
     ```
     SPOTIFY_APP_ID=your_spotify_app_id
     SPOTIFY_APP_KEY=your_spotify_app_key
     ```

4. **Find Your Computer ID:**
   - Use the Spotify REST API to find your computer ID. Refer to the [Spotify REST API documentation](https://developer.spotify.com/documentation/web-api/reference/#/operations/get-information-about-the-users-current-playback) for detailed instructions.

5. **Establish Communication:**
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
```

---

Ensure that your environment is correctly set up and all dependencies are installed. Good Luck!


*The possibility of this bricking your device is very real - every step of this process is risky and i would do so with extreme caution.*
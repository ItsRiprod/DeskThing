# The App Template ✔️
> Version 0.5 Alpha


Look through `index.js` to see how to create and develop apps

To build the app, do 
```sh
npm run build
```

Ensure the file structure of the app is as follows:

```
- your_app_id.zip
 - index.js
```

The `index.js` file is the entrypoint into your app that is used by the server. It MUST include the following methods:

start()

stop()

onMessageFromMain()

Additionally, it should return the manifest and settings based on the following templates:

```javascript
let settings = {
  "setting_example_message": { // The name of the setting
    "value": 'message1', // The current value of the setting
    "label": "Setting Example Message", // The label of this setting to be displayed
    "options": [ // An array of options for that setting
      { // Ensure you include the default data in the options
        "value": 'message1', // The value of this option
        "label": "Set to Message1" // The label of this option
      },
      {
        "value": 'message2', // The value of this option
        "label": "Set to Message2" // The label of this option
      },
    ]
  }
}

// Your manifest
const manifest = {
  isAudioSource: false, // Whether or not this app can handle audio-specific requests (default = false) 
  requires: [], // an array of required apps (e.g. 'utility') (required)
  label: "Example App", // The lable of the app (required)
  version: "v0.5.0", // The version of the app (required)
  description: "An example app to show how to use the DeskThing API", // The description of the app
  author: "Your Name Here",
  platforms: ["windows", "macos", "linux"], // supported operating systems 
  homepage: 'https://github.com/ItsRiprod/DeskThing', // Landing page for app (can be blank)
  repository: 'https://github.com/ItsRiprod/DeskThing', // Repo for app (can be blank but not recommended)
}
```

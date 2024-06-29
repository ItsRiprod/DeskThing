class UtilityHandler {
  constructor(sendDataToMainFn) {
    this.sendDataToMainFn = sendDataToMainFn
    this.settings = {
      "playback_location": {
        "value": 'local',
        "label": "Playback Location",
        "options": [
          {
            "value": 'local',
            "label": "Local"
          },
        ]
      }
    }
    this.manifest = {
      isAudioSource: false,
      requires: [],
      label: "Utility App",
      version: "v0.5.0",
      description: "This app is a utility app that controls the settings of the DeskThing",
      author: "Riprod",
      platforms: ["windows", "macos", "linux"],
      homepage: 'https://github.com/ItsRiprod/DeskThing',
      repository: 'https://github.com/ItsRiprod/DeskThing',
    }

    /* !! Add more if there are any Utility-Related app functions required !! */
  }
}

module.exports = UtilityHandler

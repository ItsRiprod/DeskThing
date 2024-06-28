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
          {
            "value": 'spotify',
            "label": "Spotify"
          },
          {
            "value": 'other',
            "label": "Other"
          },
        ]
      }
    }

    /* !! Add more if there are any Utility-Related app functions required !! */
  }
}

module.exports = UtilityHandler

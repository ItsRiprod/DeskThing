import { Key, EventFlavor, Action, MappingStructure, ButtonMapping } from '@shared/types'

const keys: Key[] = [
  {
    id: 'DynamicAction1',
    source: 'server',
    description: 'First dynamic action button on the miniplayer',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'DynamicAction2',
    source: 'server',
    description: 'Second dynamic action button on the miniplayer',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'DynamicAction3',
    source: 'server',
    description: 'Third dynamic action button on the miniplayer',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'DynamicAction4',
    source: 'server',
    description: 'Fourth dynamic action button on the miniplayer',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Action5',
    source: 'server',
    description: 'Fifth action button, always visible on the miniplayer',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Action6',
    source: 'server',
    description: 'Sixth action button, always visible on the miniplayer',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Action7',
    source: 'server',
    description: 'Seventh action button, always visible on the miniplayer',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Digit1',
    source: 'server',
    description: 'Physical Button Digit1',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.PressShort, EventFlavor.PressLong, EventFlavor.KeyDown, EventFlavor.KeyUp]
  },
  {
    id: 'Digit2',
    source: 'server',
    description: 'Physical Button Digit2',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.PressShort, EventFlavor.PressLong, EventFlavor.KeyDown, EventFlavor.KeyUp]
  },
  {
    id: 'Digit3',
    source: 'server',
    description: 'Physical Button Digit3',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.PressShort, EventFlavor.PressLong, EventFlavor.KeyDown, EventFlavor.KeyUp]
  },
  {
    id: 'Digit4',
    source: 'server',
    description: 'Physical Button Digit4',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.PressShort, EventFlavor.PressLong, EventFlavor.KeyDown, EventFlavor.KeyUp]
  },
  {
    id: 'KeyM',
    source: 'server',
    description: 'Physical Button M',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.PressShort, EventFlavor.PressLong, EventFlavor.KeyDown, EventFlavor.KeyUp]
  },
  {
    id: 'Scroll',
    source: 'server',
    description: 'Physical Button Scroll',
    version: '0.9.0',
    enabled: true,
    flavors: [
      EventFlavor.ScrollUp,
      EventFlavor.ScrollDown,
      EventFlavor.ScrollLeft,
      EventFlavor.ScrollRight
    ]
  },
  {
    id: 'Enter',
    source: 'server',
    description: 'Physical Button Enter',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown, EventFlavor.PressLong, EventFlavor.KeyDown, EventFlavor.KeyUp]
  },
  {
    id: 'Escape',
    source: 'server',
    description: 'Physical Button Escape',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.PressShort, EventFlavor.PressLong, EventFlavor.KeyDown, EventFlavor.KeyUp]
  },
  {
    id: 'Swipe',
    source: 'server',
    description: 'Touchpad Swipe Button',
    version: '0.9.0',
    enabled: true,
    flavors: [
      EventFlavor.ScrollUp,
      EventFlavor.ScrollDown,
      EventFlavor.ScrollLeft,
      EventFlavor.ScrollRight
    ]
  },
  {
    id: 'Pad1',
    source: 'server',
    description: 'Touch Pad 1 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Pad2',
    source: 'server',
    description: 'Touch Pad 2 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Pad3',
    source: 'server',
    description: 'Touch Pad 3 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Pad4',
    source: 'server',
    description: 'Touch Pad 4 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Pad5',
    source: 'server',
    description: 'Touch Pad 5 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Pad6',
    source: 'server',
    description: 'Touch Pad 6 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Pad7',
    source: 'server',
    description: 'Touch Pad 7 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Pad8',
    source: 'server',
    description: 'Touch Pad 8 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  },
  {
    id: 'Pad9',
    source: 'server',
    description: 'Touch Pad 9 on the fullscreen miniplayer view',
    version: '0.9.0',
    enabled: true,
    flavors: [EventFlavor.KeyDown]
  }
]

const actions: Action[] = [
  {
    name: 'Shuffle',
    id: 'shuffle',
    value: 'toggle',
    value_options: ['off', 'toggle', 'on'],
    value_instructions: 'Toggles the shuffle setting',
    description: 'Shuffles the song',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Rewind',
    id: 'rewind',
    value: 'rewind',
    value_options: ['rewind', 'stop'],
    value_instructions:
      'Determines if the song should skip to 0 and then skip to previous track or just skip to previous track',
    description: 'Rewinds the song',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'PlayPause',
    id: 'play',
    icon: 'play',
    description: 'Plays or Pauses the song',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Skip',
    id: 'skip',
    description: 'Skips the song',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Repeat',
    id: 'repeat',
    description: 'Toggles repeat',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Open Preference App',
    id: 'pref',
    value: '0',
    value_instructions: 'The index of the app to open',
    description: 'Opens the app at the index in the value',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Swap Apps',
    id: 'swap',
    value: '0',
    value_instructions: 'The index of the app to swap with the current app',
    description: 'Swaps the current app with the selected one',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Volume Down',
    id: 'volDown',
    value: '15',
    value_instructions: 'The amount of volume to change by',
    description: 'Turns the volume down',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Volume Up',
    id: 'volUp',
    value: '15',
    value_instructions: 'The amount of volume to change by',
    description: 'Turns the volume up',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Open App',
    id: 'open',
    value: 'utility',
    value_instructions: 'The id of the app to open',
    description: 'Opens the app defined in the value',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Toggle AppsList',
    id: 'appsList',
    value: 'toggle',
    value_options: ['hide', 'toggle', 'show'],
    value_instructions: 'How the button behaves',
    description: 'Toggles the apps list.',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Open Previous',
    id: 'swipeL',
    description: 'Opens the app at the previous index',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Open Next',
    id: 'swipeR',
    description: 'Opens the app at the next index',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Hidden Button',
    id: 'hidden',
    description: 'Hides the button. Has no action',
    source: 'server',
    version: '0.9.0',
    enabled: true
  },
  {
    name: 'Fullscreen',
    id: 'fullscreen',
    description: 'Toggles Fullscreen on most devices',
    source: 'server',
    version: '0.9.0',
    enabled: true
  }
]

const defaults: ButtonMapping = {
  id: 'default',
  name: 'The Default Mapping',
  description: 'The default mapping for the DeskThing',
  version: '0.9.0',
  mapping: {
    Pad1: {
      [EventFlavor.KeyDown]: {
        name: 'Volume Up',
        id: 'volUp',
        value: '15',
        value_instructions: 'The amount of volume to change by',
        description: 'Turns the volume up',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Pad2: {
      [EventFlavor.KeyDown]: {
        name: 'Open Previous',
        id: 'swipeL',
        description: 'Opens the app at the previous index',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Pad3: {
      [EventFlavor.KeyDown]: {
        name: 'Open Next',
        id: 'swipeR',
        description: 'Opens the app at the next index',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Pad4: {
      [EventFlavor.KeyDown]: {
        name: 'Volume Down',
        id: 'volDown',
        value: '15',
        value_instructions: 'The amount of volume to change by',
        description: 'Turns the volume down',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Pad5: {
      [EventFlavor.KeyDown]: {
        name: 'Toggle AppsList',
        id: 'appsList',
        value: 'hide',
        value_options: ['hide', 'toggle', 'show'],
        value_instructions: 'How the button behaves',
        description: 'Toggles the apps list.',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Pad6: {
      [EventFlavor.KeyDown]: {
        name: 'Toggle AppsList',
        id: 'appsList',
        value: 'show',
        value_options: ['hide', 'toggle', 'show'],
        value_instructions: 'How the button behaves',
        description: 'Toggles the apps list.',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Pad7: {
      [EventFlavor.KeyDown]: {
        name: 'Repeat',
        id: 'repeat',
        description: 'Toggles repeat',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Pad8: {
      [EventFlavor.KeyDown]: {
        name: 'PlayPause',
        id: 'play',
        icon: 'play',
        description: 'Plays or Pauses the song',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Pad9: {
      [EventFlavor.KeyDown]: {
        name: 'Fullscreen',
        id: 'fullscreen',
        description: 'Toggles Fullscreen on most devices',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    DynamicAction1: {
      [EventFlavor.KeyDown]: {
        name: 'Shuffle',
        id: 'shuffle',
        value: 'toggle',
        value_options: ['off', 'toggle', 'on'],
        value_instructions: 'Toggles the shuffle setting',
        description: 'Shuffles the song',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    DynamicAction2: {
      [EventFlavor.KeyDown]: {
        name: 'Repeat',
        id: 'repeat',
        description: 'Repeats the song',
        source: 'server',
        enabled: true,
        version: '0.9.0'
      }
    },
    DynamicAction3: {
      [EventFlavor.KeyDown]: {
        name: 'Rewind',
        id: 'rewind',
        value: 'stop',
        value_options: ['rewind', 'stop'],
        value_instructions:
          'Determines if the song should skip to 0 and then skip to previous track or just skip to previous track',
        description: 'Rewinds the song',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    DynamicAction4: {
      [EventFlavor.KeyDown]: {
        name: 'Hidden Button',
        id: 'hidden',
        description: 'Hides the button. Has no action',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Action5: {
      [EventFlavor.KeyDown]: {
        name: 'Hidden Button',
        id: 'hidden',
        description: 'Hides the button. Has no action',
        source: 'server',
        enabled: true,
        version: '0.9.0'
      }
    },
    Action6: {
      [EventFlavor.KeyDown]: {
        name: 'PlayPause',
        id: 'play',
        icon: 'play',
        description: 'Plays or Pauses the song',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Action7: {
      [EventFlavor.KeyDown]: {
        name: 'Skip',
        id: 'skip',
        description: 'Skips the song',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Digit1: {
      [EventFlavor.PressShort]: {
        name: 'Open Preference App',
        id: 'pref',
        value: '0',
        value_instructions: 'The index of the app to open',
        description: 'Opens the app at the index in the value',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.PressLong]: {
        name: 'Swap Apps',
        id: 'swap',
        value: '0',
        value_instructions: 'The index of the app to swap with the current app',
        description: 'Swaps the current app with the selected one',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Digit2: {
      [EventFlavor.PressShort]: {
        name: 'Open Preference App',
        id: 'pref',
        value: '1',
        value_instructions: 'The index of the app to open',
        description: 'Opens the app at the index in the value',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.PressLong]: {
        name: 'Swap Apps',
        id: 'swap',
        value: '1',
        value_instructions: 'The index of the app to swap with the current app',
        description: 'Swaps the current app with the selected one',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Digit3: {
      [EventFlavor.PressShort]: {
        name: 'Open Preference App',
        id: 'pref',
        value: '2',
        value_instructions: 'The index of the app to open',
        description: 'Opens the app at the index in the value',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.PressLong]: {
        name: 'Swap Apps',
        id: 'swap',
        value: '2',
        value_instructions: 'The index of the app to swap with the current app',
        description: 'Swaps the current app with the selected one',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Digit4: {
      [EventFlavor.PressShort]: {
        name: 'Open Preference App',
        id: 'pref',
        value: '3',
        value_instructions: 'The index of the app to open',
        description: 'Opens the app at the index in the value',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.PressLong]: {
        name: 'Swap Apps',
        id: 'swap',
        value: '3',
        value_instructions: 'The index of the app to swap with the current app',
        description: 'Swaps the current app with the selected one',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    KeyM: {
      [EventFlavor.PressShort]: {
        name: 'Open App',
        id: 'open',
        value: 'dashboard',
        value_instructions: 'The id of the app to open',
        description: 'Opens the app defined in the value',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.PressLong]: {
        name: 'Open App',
        id: 'open',
        value: 'utility',
        value_instructions: 'The id of the app to open',
        description: 'Opens the app defined in the value',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Scroll: {
      [EventFlavor.ScrollRight]: {
        name: 'Volume Up',
        id: 'volUp',
        value: '15',
        value_instructions: 'The amount of volume to change by',
        description: 'Turns the volume up',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.ScrollUp]: {
        name: 'Volume Up',
        id: 'volUp',
        value: '15',
        value_instructions: 'The amount of volume to change by',
        description: 'Turns the volume up',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.ScrollLeft]: {
        name: 'Volume Down',
        id: 'volDown',
        value: '15',
        value_instructions: 'The amount of volume to change by',
        description: 'Turns the volume down',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.ScrollDown]: {
        name: 'Volume Down',
        id: 'volDown',
        value: '15',
        value_instructions: 'The amount of volume to change by',
        description: 'Turns the volume down',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Enter: {
      [EventFlavor.KeyDown]: {
        name: 'PlayPause',
        id: 'play',
        icon: 'play',
        description: 'Plays or Pauses the song',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.PressLong]: {
        name: 'Skip',
        id: 'skip',
        description: 'Skips the song',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Escape: {
      [EventFlavor.PressShort]: {
        name: 'Toggle AppsList',
        id: 'appsList',
        value: 'show',
        value_options: ['hide', 'toggle', 'show'],
        value_instructions: 'How the button behaves',
        description: 'Toggles the apps list.',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.PressLong]: {
        name: 'Toggle AppsList',
        id: 'appsList',
        value: 'hide',
        value_options: ['hide', 'toggle', 'show'],
        value_instructions: 'How the button behaves',
        description: 'Toggles the apps list.',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    },
    Swipe: {
      [EventFlavor.SwipeUp]: {
        name: 'Toggle AppsList',
        id: 'appsList',
        value: 'hide',
        value_instructions: 'hide, toggle, show',
        description: 'Toggles the apps list.',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.SwipeDown]: {
        name: 'Toggle AppsList',
        id: 'appsList',
        value: 'show',
        value_instructions: 'hide, toggle, show',
        description: 'Toggles the apps list.',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.SwipeLeft]: {
        name: 'Open Previous',
        id: 'swipeL',
        description: 'Opens the app at the previous index',
        source: 'server',
        version: '0.9.0',
        enabled: true
      },
      [EventFlavor.SwipeRight]: {
        name: 'Open Next',
        id: 'swipeR',
        description: 'Opens the app at the next index',
        source: 'server',
        version: '0.9.0',
        enabled: true
      }
    }
  }
}

export const defaultData: MappingStructure = {
  version: '0.9.0',
  selected_profile: 'default',
  profiles: {
    default: defaults
  },
  keys: keys,
  actions: actions
}

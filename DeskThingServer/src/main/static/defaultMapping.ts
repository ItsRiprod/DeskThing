import { Key, EventMode, Action, MappingStructure, ButtonMapping, Profile } from '@shared/types'

const keys: Key[] = [
  {
    id: 'Wheel1',
    source: 'server',
    description: 'A wheel button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Wheel2',
    source: 'server',
    description: 'A wheel button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Wheel3',
    source: 'server',
    description: 'A wheel button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Wheel4',
    source: 'server',
    description: 'A wheel button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Tray1',
    source: 'server',
    description: 'The app tray button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Tray2',
    source: 'server',
    description: 'The app tray button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Tray3',
    source: 'server',
    description: 'The app tray button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Tray4',
    source: 'server',
    description: 'The app tray button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Tray5',
    source: 'server',
    description: 'The app tray button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Tray6',
    source: 'server',
    description: 'The app tray button',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'DynamicAction1',
    source: 'server',
    description: 'First dynamic action button on the miniplayer',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'DynamicAction2',
    source: 'server',
    description: 'Second dynamic action button on the miniplayer',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'DynamicAction3',
    source: 'server',
    description: 'Third dynamic action button on the miniplayer',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'DynamicAction4',
    source: 'server',
    description: 'Fourth dynamic action button on the miniplayer',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Action5',
    source: 'server',
    description: 'Fifth action button, always visible on the miniplayer',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Action6',
    source: 'server',
    description: 'Sixth action button, always visible on the miniplayer',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Action7',
    source: 'server',
    description: 'Seventh action button, always visible on the miniplayer',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.KeyDown]
  },
  {
    id: 'Digit1',
    source: 'server',
    description: 'Physical Button Digit1',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.PressShort, EventMode.PressLong, EventMode.KeyDown, EventMode.KeyUp]
  },
  {
    id: 'Digit2',
    source: 'server',
    description: 'Physical Button Digit2',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.PressShort, EventMode.PressLong, EventMode.KeyDown, EventMode.KeyUp]
  },
  {
    id: 'Digit3',
    source: 'server',
    description: 'Physical Button Digit3',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.PressShort, EventMode.PressLong, EventMode.KeyDown, EventMode.KeyUp]
  },
  {
    id: 'Digit4',
    source: 'server',
    description: 'Physical Button Digit4',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.PressShort, EventMode.PressLong, EventMode.KeyDown, EventMode.KeyUp]
  },
  {
    id: 'KeyM',
    source: 'server',
    description: 'Physical Button M',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.PressShort, EventMode.PressLong, EventMode.KeyDown, EventMode.KeyUp]
  },
  {
    id: 'Scroll',
    source: 'server',
    description: 'Physical Button Scroll',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.ScrollUp, EventMode.ScrollDown, EventMode.ScrollLeft, EventMode.ScrollRight]
  },
  {
    id: 'Enter',
    source: 'server',
    description: 'Physical Button Enter',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.PressShort, EventMode.PressLong, EventMode.KeyDown, EventMode.KeyUp]
  },
  {
    id: 'Escape',
    source: 'server',
    description: 'Physical Button Escape',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.PressShort, EventMode.PressLong, EventMode.KeyDown, EventMode.KeyUp]
  },
  {
    id: 'Swipe',
    source: 'server',
    description: 'Touchpad Swipe Button',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    modes: [EventMode.SwipeUp, EventMode.SwipeDown, EventMode.SwipeLeft, EventMode.SwipeRight]
  }
]

const actions: Action[] = [
  {
    name: 'Toggle Wheel',
    id: 'wheel',
    icon: 'wheel',
    description: 'Opens the selection wheel',
    source: 'server',
    version: '0.9.1',
    version_code: 9.1,
    enabled: true,
    tag: 'nav'
  },
  {
    name: 'Shuffle',
    id: 'shuffle',
    value: 'toggle',
    value_options: ['off', 'toggle', 'on'],
    value_instructions: 'Toggles the shuffle setting',
    description: 'Shuffles the song',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'media'
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
    version_code: 9,
    enabled: true,
    tag: 'media'
  },
  {
    name: 'PlayPause',
    id: 'play',
    icon: 'play',
    description: 'Plays or Pauses the song',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'media'
  },
  {
    name: 'Skip',
    id: 'skip',
    description: 'Skips the song',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'media'
  },
  {
    name: 'Repeat',
    id: 'repeat',
    description: 'Toggles repeat',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'media'
  },
  {
    name: 'Open Tray App',
    id: 'pref',
    value: '0',
    value_instructions: 'The index of the app to open',
    description: 'Opens the app at the index in the value',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'nav'
  },
  {
    name: 'Swap Apps',
    id: 'swap',
    value: '0',
    value_instructions: 'The index of the app to swap with the current app',
    description: 'Swaps the current app with the selected one',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'nav'
  },
  {
    name: 'Volume Down',
    id: 'voldown',
    value: '15',
    value_instructions: 'The amount of volume to change by',
    description: 'Turns the volume down',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'media'
  },
  {
    name: 'Volume Up',
    id: 'volup',
    value: '15',
    value_instructions: 'The amount of volume to change by',
    description: 'Turns the volume up',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'media'
  },
  {
    name: 'Open App',
    id: 'open',
    value: 'utility',
    value_instructions: 'The id of the app to open',
    description: 'Opens the app defined in the value',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'nav'
  },
  {
    name: 'Toggle AppsList',
    id: 'appslist',
    value: 'toggle',
    value_options: ['hide', 'toggle', 'show'],
    value_instructions: 'How the button behaves',
    description: 'Toggles the apps list.',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'nav'
  },
  {
    name: 'Open Previous',
    id: 'swipel',
    description: 'Opens the app at the previous index',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'nav'
  },
  {
    name: 'Open Next',
    id: 'swiper',
    description: 'Opens the app at the next index',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'nav'
  },
  {
    name: 'Hidden Button',
    id: 'hidden',
    description: 'Hides the button. Has no action',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'basic'
  },
  {
    name: 'Fullscreen',
    id: 'fullscreen',
    description: 'Toggles Fullscreen on most devices',
    source: 'server',
    version: '0.9.0',
    version_code: 9,
    enabled: true,
    tag: 'nav'
  }
]

export const defaultProfile: Profile = {
  id: 'default',
  name: 'Default',
  description: 'The default mapping for the DeskThing',
  version: '0.9.4',
  version_code: 9.4
}

export const defaults: ButtonMapping = {
  ...defaultProfile,
  mapping: {
    Wheel1: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '0'
      }
    },
    Wheel2: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '1'
      }
    },
    Wheel3: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '2'
      }
    },
    Wheel4: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '3'
      }
    },
    Tray1: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '0'
      }
    },
    Tray2: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '1'
      }
    },
    Tray3: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '2'
      }
    },
    Tray4: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '3'
      }
    },
    Tray5: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '4'
      }
    },
    Tray6: {
      [EventMode.KeyDown]: {
        enabled: true,
        id: 'pref',
        source: 'server',
        value: '5'
      }
    },
    DynamicAction1: {
      [EventMode.KeyDown]: {
        id: 'shuffle',
        source: 'server',
        value: 'toggle',
        enabled: true
      }
    },
    DynamicAction2: {
      [EventMode.KeyDown]: {
        id: 'repeat',
        source: 'server',
        enabled: true
      }
    },
    DynamicAction3: {
      [EventMode.KeyDown]: {
        id: 'rewind',
        value: 'stop',
        source: 'server',
        enabled: true
      }
    },
    DynamicAction4: {
      [EventMode.KeyDown]: {
        id: 'hidden',
        source: 'server',
        enabled: true
      }
    },
    Action5: {
      [EventMode.KeyDown]: {
        id: 'hidden',
        source: 'server',
        enabled: true
      }
    },
    Action6: {
      [EventMode.KeyDown]: {
        id: 'play',
        source: 'server',
        enabled: true
      }
    },
    Action7: {
      [EventMode.KeyDown]: {
        id: 'skip',
        source: 'server',
        enabled: true
      }
    },
    Digit1: {
      [EventMode.PressShort]: {
        id: 'pref',
        source: 'server',
        value: '0',
        enabled: true
      },
      [EventMode.PressLong]: {
        id: 'swap',
        source: 'server',
        value: '0',
        enabled: true
      }
    },
    Digit2: {
      [EventMode.PressShort]: {
        id: 'pref',
        source: 'server',
        value: '1',
        enabled: true
      },
      [EventMode.PressLong]: {
        id: 'swap',
        source: 'server',
        value: '1',
        enabled: true
      }
    },
    Digit3: {
      [EventMode.PressShort]: {
        id: 'pref',
        source: 'server',
        value: '2',
        enabled: true
      },
      [EventMode.PressLong]: {
        id: 'swap',
        source: 'server',
        value: '2',
        enabled: true
      }
    },
    Digit4: {
      [EventMode.PressShort]: {
        id: 'pref',
        source: 'server',
        value: '3',
        enabled: true
      },
      [EventMode.PressLong]: {
        id: 'swap',
        source: 'server',
        value: '3',
        enabled: true
      }
    },
    KeyM: {
      [EventMode.PressShort]: {
        id: 'open',
        source: 'server',
        value: 'dashboard',
        enabled: true
      },
      [EventMode.PressLong]: {
        id: 'open',
        value: 'utility',
        source: 'server',
        enabled: true
      }
    },
    Scroll: {
      [EventMode.ScrollRight]: {
        id: 'volup',
        value: '15',
        source: 'server',
        enabled: true
      },
      [EventMode.ScrollUp]: {
        id: 'volup',
        value: '15',
        source: 'server',
        enabled: true
      },
      [EventMode.ScrollLeft]: {
        id: 'voldown',
        value: '15',
        source: 'server',
        enabled: true
      },
      [EventMode.ScrollDown]: {
        id: 'voldown',
        value: '15',
        source: 'server',
        enabled: true
      }
    },
    Enter: {
      [EventMode.KeyDown]: {
        id: 'wheel',
        source: 'server',
        enabled: true
      },
      [EventMode.PressLong]: {
        id: 'skip',
        source: 'server',
        enabled: true
      }
    },
    Escape: {
      [EventMode.PressShort]: {
        id: 'appslist',
        value: 'show',
        source: 'server',
        enabled: true
      },
      [EventMode.PressLong]: {
        id: 'appslist',
        value: 'hide',
        source: 'server',
        enabled: true
      }
    },
    Swipe: {
      [EventMode.SwipeUp]: {
        id: 'appslist',
        value: 'hide',
        source: 'server',
        enabled: true
      },
      [EventMode.SwipeDown]: {
        id: 'appslist',
        value: 'show',
        source: 'server',
        enabled: true
      },
      [EventMode.SwipeLeft]: {
        id: 'swipel',
        source: 'server',
        enabled: true
      },
      [EventMode.SwipeRight]: {
        id: 'swiper',
        source: 'server',
        enabled: true
      }
    }
  }
}

export const defaultData: MappingStructure = {
  version: '0.9.5',
  version_code: 9.5,
  selected_profile: defaultProfile,
  profiles: {
    default: defaults
  },
  keys: keys,
  actions: actions
}

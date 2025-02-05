import { TaskList, Task, STEP_TYPES } from '@shared/types/tasks'

const tasks: { [key: string]: Task } = {
  gettingstarted: {
    id: 'gettingstarted',
    version: '0.10.4',
    started: false,
    available: true,
    source: 'server',
    label: 'Welcome to DeskThing',
    description:
      'Getting everything setup for you. This will guide you through the initial setup process.',
    steps: {
      client: {
        id: 'client',
        type: STEP_TYPES.TASK,
        label: 'Setup the Client',
        taskId: 'client',
        instructions: 'Ensure you have a client setup',
        completed: false
      },
      device: {
        id: 'device',
        type: STEP_TYPES.TASK,
        label: 'Setup the Car Thing',
        taskId: 'device',
        instructions: 'Finish setting up a device!',
        completed: false
      },
      app: {
        id: 'app',
        type: STEP_TYPES.SHORTCUT,
        destination: 'downloads/app',
        label: 'Setup an App',
        instructions: 'Download your first app!',
        completed: false
      }
    },
    completed: false
  },
  device: {
    id: 'device',
    version: '0.10.4',
    started: false,
    available: true,
    source: 'server',
    label: 'Setting up a Device',
    description: 'Setting up your Car Thing to work with DeskThing!',
    steps: {
      client: {
        id: 'client',
        type: STEP_TYPES.TASK,
        label: 'Install the Client',
        taskId: 'client',
        instructions: 'Ensure you have a client setup',
        completed: false
      },
      setup: {
        id: 'setup',
        type: STEP_TYPES.EXTERNAL,
        label: 'Setup',
        instructions: 'Go to the DeskThing youtube channel and follow a Step A video',
        url: 'https://deskthing.app/youtube',
        completed: false
      },
      connect: {
        id: 'connect',
        type: STEP_TYPES.EXTERNAL,
        label: 'Plug in your Car Thing',
        instructions: 'Plug in your device to your computer!',
        completed: false
      },
      navigate: {
        id: 'navigate',
        type: STEP_TYPES.SHORTCUT,
        destination: 'clients/connections',
        label: 'Navigate To Connections',
        instructions: 'Go to the Connections tab',
        completed: false
      },
      detect: {
        id: 'detect',
        type: STEP_TYPES.STEP,
        label: 'Detect Device',
        instructions: 'Refresh ADB until you see your device',
        completed: false,
        strict: true,
        debugging: {
          cable: {
            id: 'cable',
            type: STEP_TYPES.EXTERNAL,
            label: 'Different cable',
            instructions: 'Try using a different cable'
          },
          port: {
            id: 'port',
            type: STEP_TYPES.EXTERNAL,
            label: 'Different port',
            instructions: 'Try different ports on your computer'
          },
          driver: {
            id: 'driver',
            type: STEP_TYPES.EXTERNAL,
            label: 'Windows - Check Drivers',
            instructions:
              'Ensure ADB Interface and NDIS Compatible Device show up in Device Manager'
          },
          norndis: {
            id: 'norndis',
            type: STEP_TYPES.EXTERNAL,
            label: 'AMD CPU - norndis',
            instructions: 'Reflash with the "norndis" image in Thing Labs and try again'
          },
          biosport: {
            id: 'biosport',
            type: STEP_TYPES.EXTERNAL,
            label: 'AMD CPU - Try the BIOS port',
            instructions: 'Try using the BIOS port on your motherboard'
          }
        }
      },
      configure: {
        id: 'configure',
        type: STEP_TYPES.STEP,
        label: 'Configure',
        instructions: 'Click "configure" next to your device in the Connections tab',
        completed: false,
        strict: true,
        debugging: {
          offline: {
            id: 'offline',
            type: STEP_TYPES.EXTERNAL,
            label: 'Offline',
            instructions: 'If your device is offline, click the "reconnect offline" button'
          }
        }
      }
    },
    completed: false
  },
  client: {
    id: 'client',
    version: '0.10.3',
    started: false,
    available: true,
    source: 'server',
    label: 'Setting up a Client',
    description: 'Downloading a client to DeskThing',
    steps: {
      navigate: {
        id: 'navigate',
        type: STEP_TYPES.SHORTCUT,
        label: 'Go to Client Downloads',
        destination: 'downloads/client',
        instructions: 'Navigate to the Client Downloads page',
        completed: false
      },
      download: {
        id: 'download',
        type: STEP_TYPES.STEP,
        label: 'Download a Client',
        strict: true,
        instructions: 'Click Download Latest on the DeskThing Client to download it.',
        completed: false
      },
      refresh: {
        id: 'refresh',
        type: STEP_TYPES.STEP,
        strict: false,
        label: 'Refresh the client',
        instructions: 'Ensure you Refresh the client and ensure the new version is installed.',
        completed: false
      }
    },
    completed: false
  },
  updateClient: {
    id: 'updateClient',
    version: '0.10.3',
    started: false,
    source: 'server',
    label: 'Setting up a Device',
    description: "Looks like theres a new client! Lets ensure we're up to date.",
    steps: {
      download: {
        id: 'download',
        type: STEP_TYPES.SHORTCUT,
        label: 'Download the updated Client',
        destination: 'downloads/client',
        instructions: 'Go to the downloads page and download the latest client',
        completed: false
      },
      refresh: {
        id: 'refresh',
        type: STEP_TYPES.STEP,
        label: 'Refresh the client',
        instructions: 'Ensure you Refresh the client and ensure the new version is installed.',
        completed: false
      },
      flash: {
        id: 'flash',
        type: STEP_TYPES.SHORTCUT,
        label: 'Flash the new client',
        destination: 'clients/connections',
        instructions: 'Click Details -> Push Staged to load the new client to your device!',
        completed: false
      }
    },
    completed: false
  }
}

const defaultTask: TaskList = {
  version: '0.10.4',
  tasks
}
export default defaultTask

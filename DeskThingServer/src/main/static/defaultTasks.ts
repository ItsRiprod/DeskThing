import { TaskList, Task } from '@shared/types/tasks'

const tasks: { [key: string]: Task } = {
  gettingstarted: {
    id: 'gettingstarted',
    version: '0.10.5',
    started: true,
    source: 'server',
    label: 'Welcome to DeskThing',
    description:
      'Getting everything setup for you. This will guide you through the initial setup process.',
    steps: {
      client: {
        id: 'client',
        type: 'task',
        label: 'Setup the Client',
        taskId: 'client',
        instructions: 'Ensure you have a client setup',
        completed: false
      },
      device: {
        id: 'device',
        type: 'task',
        label: 'Setup the Car Thing',
        taskId: 'device',
        instructions: 'Finish setting up a device!',
        completed: false
      },
      app: {
        id: 'app',
        type: 'shortcut',
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
    started: true,
    source: 'server',
    label: 'Setting up a Device',
    description: 'Set up your Car Thing to work with DeskThing!',
    steps: {
      client: {
        id: 'client',
        type: 'task',
        label: 'Install the Client',
        taskId: 'client',
        instructions: 'Ensure you have a client setup',
        completed: false
      },
      setup: {
        id: 'setup',
        type: 'external',
        label: 'Setup',
        instructions: 'Go to the DeskThing youtube channel and follow a Step A video',
        url: 'https://deskthing.com/youtube',
        completed: false
      },
      connect: {
        id: 'connect',
        type: 'external',
        label: 'Plug in your Car Thing',
        instructions: 'Plug in your device to your computer!',
        completed: false
      },
      detect: {
        id: 'detect',
        type: 'shortcut',
        destination: 'clients/connections',
        label: 'Detect',
        instructions: 'Find your device in the Connections tab',
        completed: false,
        debugging: {
          cable: {
            id: 'cable',
            type: 'external',
            label: 'Different cable',
            instructions: 'Try using a different cable'
          },
          port: {
            id: 'port',
            type: 'external',
            label: 'Different port',
            instructions: 'Try different ports on your computer'
          },
          driver: {
            id: 'driver',
            type: 'external',
            label: 'Windows - Check Drivers',
            instructions:
              'Ensure ADB Interface and NDIS Compatible Device show up in Device Manager'
          },
          norndis: {
            id: 'norndis',
            type: 'external',
            label: 'AMD CPU - norndis',
            instructions: 'Reflash with the "norndis" image in Thing Labs and try again'
          },
          biosport: {
            id: 'biosport',
            type: 'external',
            label: 'AMD CPU - Try the BIOS port',
            instructions: 'Try using the BIOS port on your motherboard'
          }
        }
      },
      configure: {
        id: 'configure',
        type: 'shortcut',
        destination: 'clients/connections',
        label: 'Configure',
        instructions: 'Configure your device in the Connections tab',
        completed: false,
        debugging: {
          offline: {
            id: 'offline',
            type: 'external',
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
    version: '0.10.4',
    started: true,
    source: 'server',
    label: 'Setting up a Device',
    description: 'Let us go over how to download a client to DeskThing',
    steps: {
      client: {
        id: 'client',
        type: 'shortcut',
        label: 'Download a Client',
        destination: 'downloads/client',
        instructions: 'Click Download Latest on the DeskThing Client to download it.',
        completed: false
      },
      refresh: {
        id: 'refresh',
        type: 'step',
        label: 'Refresh the client',
        instructions: 'Ensure you Refresh the client and ensure the new version is installed.',
        completed: false
      }
    },
    completed: false
  },
  updateClient: {
    id: 'updateClient',
    version: '0.10.4',
    started: true,
    source: 'server',
    label: 'Setting up a Device',
    description: "Looks like theres a new client! Lets ensure we're up to date.",
    steps: {
      download: {
        id: 'download',
        type: 'shortcut',
        label: 'Download the updated Client',
        destination: 'downloads/client',
        instructions: 'Go to the downloads page and download the latest client',
        completed: false
      },
      refresh: {
        id: 'refresh',
        type: 'step',
        label: 'Refresh the client',
        instructions: 'Ensure you Refresh the client and ensure the new version is installed.',
        completed: false
      },
      flash: {
        id: 'flash',
        type: 'shortcut',
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

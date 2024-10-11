import { create } from 'zustand'
import { Client } from '@shared/types'

// Utility function to parse ADB devices
const parseADBDevices = (response: string): string[] => {
  return response
    .split('\n')
    .filter((line) => line && !line.startsWith('List of devices attached') && line.trim() !== '')
    .map((line) => line.replace('device', '').trim())
}

interface ClientStoreState {
  ADBDevices: string[]
  connections: number
  clients: Client[]

  // Actions
  setADBDevices: (devices: string[]) => void
  setConnections: (connections: number) => void
  setClients: (clients: Client[]) => void
  requestADBDevices: () => Promise<void>
  requestConnections: () => Promise<void>
  loadClientUrl: (url: string) => Promise<void>
  loadClientZip: (zip: string) => Promise<void>
}

// Create Zustand store
const useClientStore = create<ClientStoreState>((set) => ({
  ADBDevices: [],
  connections: 0,
  clients: [],

  // Setters
  setADBDevices: (devices: string[]): void => set({ ADBDevices: devices }),
  setConnections: (connections: number): void => set({ connections }),
  setClients: (clients: Client[]): void => set({ clients }),

  // Request ADB Devices
  requestADBDevices: async (): Promise<void> => {
    try {
      const response = await window.electron.handleClientADB('devices')
      if (response) {
        const deviceList = parseADBDevices(response)
        set({ ADBDevices: deviceList })
      } else {
        console.log('No devices found')
      }
    } catch (error) {
      console.error('Error fetching ADB devices:', error)
    }
  },

  // Request Connections
  requestConnections: async (): Promise<void> => {
    try {
      const connections = await window.electron.getConnections()
      set({ connections: connections.length })
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  },

  loadClientUrl: async (url: string): Promise<void> => {
    await window.electron.handleClientURL(url)
  },

  loadClientZip: async (zip: string): Promise<void> => {
    await window.electron.handleClientZip(zip)
  }
}))

export default useClientStore

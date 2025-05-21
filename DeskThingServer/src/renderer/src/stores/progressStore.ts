import { create } from 'zustand'
import { ProgressChannel, ProgressEvent, ProgressStatus } from '@shared/types'

interface ProgressStore {
  // State
  progressMap: Map<ProgressChannel, ProgressEvent>
  initialized: boolean
  subscribed_channels: ProgressChannel[]
  currentProgressEvent: ProgressEvent | undefined
  pastEvents: Map<ProgressChannel, string[]>

  // Actions
  initialize: () => Promise<void>
  updateProgress: (event: ProgressEvent) => void
  clearProgress: (channel: ProgressChannel) => void
  clearAllProgress: () => void

  subscribe_channel: (channel: ProgressChannel) => void
  unsubscribe_channel: (channel: ProgressChannel) => void

  // Selectors (computed values)
  getChannelProgress: (channel: ProgressChannel) => ProgressEvent | undefined
  isAnyLoading: () => boolean
  getAllActiveChannels: () => ProgressChannel[]
}

export const useProgressStore = create<ProgressStore>()((set, get) => ({
  // Initial state
  progressMap: new Map(),
  currentProgressEvent: undefined,
  initialized: false,
  subscribed_channels: [],
  pastEvents: new Map(),

  initialize: async () => {
    if (get().initialized) return

    window.electron.onProgress((event: ProgressEvent) => {
      if (!get().subscribed_channels.includes(event.channel)) { // ignore any channels not subscribed to
        console.log(`Ignoring channel ${event.channel}`)
        return
      }
      get().updateProgress(event)
    })

    set({ initialized: true })
  },

  subscribe_channel: (channel: ProgressChannel) =>
    set((state) => {
      state.subscribed_channels.push(channel)
      console.debug(`Subscribed to progress channel: ${channel}`, state.subscribed_channels)
      return { subscribed_channels: state.subscribed_channels }
    }),

  unsubscribe_channel: (channel: ProgressChannel) =>
    set((state) => {
      if (!state.subscribed_channels.includes(channel)) return state

      state.subscribed_channels.splice(state.subscribed_channels.indexOf(channel), 1)
      console.debug(`Unsubscribed from progress channel: ${channel}`, state.subscribed_channels)
      return { subscribed_channels: state.subscribed_channels }
    }),

  // Actions
  updateProgress: (event: ProgressEvent) =>
    set((state) => {
      console.debug(`[${event.operation}] [${event.channel}]: ${event.message}`, event)

      event.id = crypto.randomUUID()

      if (state.pastEvents.has(event.channel)) {
        if (state.currentProgressEvent?.channel != event.channel) {
          // state.pastEvents.delete(event.channel)
        }
        state.pastEvents.get(event.channel)?.push(`(${event.progress || 0}) ${event.message}`)
      } else {
        state.pastEvents.set(event.channel, [`(${event.progress || 0}) ${event.message}`])
      }


      state.progressMap.set(event.channel, event)
      return { progressMap: state.progressMap, currentProgressEvent: event }
    }),

  clearProgress: (channel: ProgressChannel) =>
    set((state) => {
      console.debug(`Clearing progress for channel: ${channel}`)
      const newMap = new Map(state.progressMap)
      newMap.delete(channel)
      return { progressMap: newMap }
    }),

  clearAllProgress: () => set({ progressMap: new Map() }),

  getChannelProgress: (channel: ProgressChannel) => {
    return get().progressMap.get(channel)
  },

  isAnyLoading: () => {
    return Array.from(get().progressMap.values()).some(
      (state) => ![ProgressStatus.COMPLETE, ProgressStatus.ERROR].includes(state.status)
    )
  },

  getAllActiveChannels: () => Array.from(get().progressMap.keys())
}))

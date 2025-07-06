import { create } from 'zustand'
import { ProgressChannel, ProgressEvent, ProgressStatus } from '@shared/types'

interface ProgressStore {
  // State
  progressMap: Map<ProgressChannel, ProgressEvent>
  initialized: boolean
  subscribed_channels: ProgressChannel[]
  currentProgressEvent: ProgressEvent | undefined
  pastEvents: Map<ProgressChannel, ProgressEvent[]>

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
      if (!get().subscribed_channels.includes(event.channel)) {
        // ignore any channels not subscribed to
        return
      }
      console.debug(`Ran channel ${event.channel}`)
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

      const eventWithId = { ...event, id: crypto.randomUUID() }
      const newPastEvents = new Map(state.pastEvents)
      const newProgressMap = new Map(state.progressMap)

      // Check if the event has already been logged before
      if (newPastEvents.has(eventWithId.channel)) {
        // Check if the event is in the progress map
        if (newProgressMap.has(eventWithId.channel)) {
          const oldProgress = newProgressMap.get(eventWithId.channel)?.progress
          const newProgress = eventWithId?.progress

          // If the new progress is less than the old progress - this is a new event
          const isRestart =
            oldProgress !== undefined && newProgress !== undefined && newProgress < oldProgress

          if (isRestart) {
            newPastEvents.delete(eventWithId.channel)
          }
        }

        // Add this channel to that event
        newPastEvents.get(eventWithId.channel)?.push(eventWithId)
      } else {
        newPastEvents.set(eventWithId.channel, [eventWithId])
      }

      newProgressMap.set(event.channel, event)
      return { progressMap: newProgressMap, pastEvents: newPastEvents, currentProgressEvent: event }
    }),

  clearProgress: (channel: ProgressChannel) =>
    set((state) => {
      console.debug(`Clearing progress for channel: ${channel}`)
      const newProgressMap = new Map(state.progressMap)
      const newPastEvents = new Map(state.pastEvents)

      newProgressMap.delete(channel)
      newPastEvents.delete(channel)

      return {
        progressMap: newProgressMap,
        pastEvents: newPastEvents
      }
    }),

  clearAllProgress: () => set({ progressMap: new Map(), pastEvents: new Map() }),

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

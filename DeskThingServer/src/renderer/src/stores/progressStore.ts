import { create } from 'zustand'
import { ProgressChannel, ProgressEvent, ProgressStatus } from '@shared/types'

interface ProgressStore {
  // State
  progressMap: Map<ProgressChannel, ProgressEvent>
  initialized: boolean
  subscribed_channels: ProgressChannel[]
  currentProgressEvent: ProgressEvent | undefined

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

  initialize: async () => {
    if (get().initialized) return

    window.electron.onProgress((event: ProgressEvent) => {
      get().updateProgress(event)
    })

    set({ initialized: true })
  },

  subscribe_channel: (channel: ProgressChannel) =>
    set((state) => {
      if (!state.subscribed_channels.includes(channel)) {
        state.subscribed_channels.push(channel)
      }
      return { subscribed_channels: state.subscribed_channels }
    }),

  unsubscribe_channel: (channel: ProgressChannel) =>
    set((state) => {
      state.subscribed_channels = state.subscribed_channels.filter((c) => c !== channel)
      return { subscribed_channels: state.subscribed_channels }
    }),

  // Actions
  updateProgress: (event: ProgressEvent) =>
    set((state) => {
      console.debug(`[${event.operation}] [${event.channel}]: ${event.message}`, event)

      const existingProgress = state.progressMap.get(event.channel)

      // Create new progress state by merging existing state with new event data
      const updatedProgress: ProgressEvent = {
        // Keep existing values if available
        ...existingProgress,
        ...event,
        // Use new progress if provided, otherwise keep existing
        progress:
          (event.progress ?? event.status == ProgressStatus.COMPLETE)
            ? 100
            : event.status == ProgressStatus.RUNNING
              ? 0
              : (existingProgress?.progress ?? 0),
        // Merge metadata if both exist, otherwise use new or existing
        metadata: event.metadata
          ? { ...existingProgress?.metadata, ...event.metadata }
          : existingProgress?.metadata,
        isLoading: [ProgressStatus.INFO, ProgressStatus.RUNNING, ProgressStatus.WARN].includes(
          event.status
        ),
        id: crypto.randomUUID(),
        error: event.status === ProgressStatus.ERROR ? event.error : undefined,
        timestamp: Date.now()
      }

      const newMap = new Map(state.progressMap)
      newMap.set(event.channel, updatedProgress)
      return { progressMap: newMap, currentProgressEvent: updatedProgress }
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

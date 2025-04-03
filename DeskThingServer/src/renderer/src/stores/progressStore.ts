import { create } from 'zustand'
import { ProgressChannel, ProgressEvent, ProgressStatus } from '@shared/types'

export interface ProgressState {
  operation: string
  status: ProgressStatus
  message: string
  progress?: number
  metadata?: Record<string, unknown>
  isLoading?: boolean
  id: string
  error?: string
  timestamp: number
}

interface ProgressStore {
  // State
  progressMap: Map<ProgressChannel, ProgressState>
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  updateProgress: (event: ProgressEvent) => void
  clearProgress: (channel: ProgressChannel) => void
  clearAllProgress: () => void

  // Selectors (computed values)
  getChannelProgress: (channel: ProgressChannel) => ProgressState | undefined
  isAnyLoading: () => boolean
  getAllActiveChannels: () => ProgressChannel[]
}

export const useProgressStore = create<ProgressStore>()((set, get) => ({
  // Initial state
  progressMap: new Map(),
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    window.electron.onProgress((event: ProgressEvent) => {
      get().updateProgress(event)
    })

    set({ initialized: true })
  },

  // Actions
  updateProgress: (event: ProgressEvent) =>
    set((state) => {
      console.debug(`[${event.operation}] [${event.channel}]: ${event.message}`, event)

      const existingProgress = state.progressMap.get(event.channel)

      // Create new progress state by merging existing state with new event data
      const updatedProgress: ProgressState = {
        // Keep existing values if available
        ...existingProgress,
        // Override with new values from the event
        operation: event.operation,
        status: event.status,
        message: event.message,
        // Generate a new ID only for new messages
        id: existingProgress?.id || Math.random().toString(24),
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
        error: event.status === ProgressStatus.ERROR ? event.error : undefined,
        timestamp: Date.now()
      }

      const newMap = new Map(state.progressMap)
      newMap.set(event.channel, updatedProgress)

      return { progressMap: newMap }
    }),

  clearProgress: (channel: ProgressChannel) =>
    set((state) => {
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

import { ProgressChannel } from '@shared/types'
import { ProgressState, useProgressStore } from '@renderer/stores/progressStore'

// Hook for specific channels
export const useChannelProgress = (
  channel: ProgressChannel
): { progress: ProgressState | undefined; isLoading: boolean } => {
  const progress = useProgressStore((state) => state.getChannelProgress(channel))

  return { progress, isLoading: progress?.isLoading ?? false }
}

import { ProgressChannel, ProgressEvent } from '@shared/types'
import { useProgressStore } from '@renderer/stores/progressStore'
import { useEffect } from 'react';

// Hook for specific channels
export const useChannelProgress = (
  channel: ProgressChannel
): { progress: ProgressEvent | undefined; isLoading: boolean } => {
  const progressEvent = useProgressStore((state) => state.getChannelProgress(channel))
  const subscribe = useProgressStore((state) => state.subscribe_channel)
  const unsubscribe = useProgressStore((state) => state.unsubscribe_channel)

  useEffect(() => {
    subscribe(channel)
    return () => unsubscribe(channel)
  }, [channel, subscribe, unsubscribe])

  return { progress: progressEvent, isLoading: progressEvent?.isLoading ?? false }
}

import { EventEmitter } from 'events'
import logger from '@server/utils/logger'
import { OperationContext, ProgressChannel, ProgressEvent } from '@shared/types'

class ProgressEventBus extends EventEmitter {
  private static instance: ProgressEventBus
  private operationHierarchy: Map<ProgressChannel, OperationContext> = new Map()
  private activeContext: OperationContext | null = null
  private channelMap: Map<ProgressChannel, ProgressChannel> = new Map()
  private channelOperationMap: Map<ProgressChannel, string> = new Map()

  static getInstance(): ProgressEventBus {
    if (!ProgressEventBus.instance) {
      ProgressEventBus.instance = new ProgressEventBus()
    }
    return ProgressEventBus.instance
  }

  startOperation(
    channel: ProgressChannel,
    operation: string,
    message: string,
    subOperations: Array<{ channel: ProgressChannel; weight: number }> = []
  ): void {
    const context: OperationContext = {
      channel,
      operation,
      subOperations: new Map(),
      totalWeight: 0,
      startTime: Date.now(),
      parentContext: null
    }

    let totalWeight = 0
    let progressOffset = 0

    subOperations.forEach((sub) => {
      context.subOperations.set(sub.channel, {
        weight: sub.weight,
        progressOffset
      })
      totalWeight += sub.weight

      // Map child to parent context for proper bubbling
      this.operationHierarchy.set(sub.channel, context)

      progressOffset += (sub.weight / totalWeight) * 100
    })

    context.totalWeight = totalWeight

    if (this.activeContext) {
      // If we already have an active context, we need to handle nesting
      if (this.operationHierarchy.has(channel)) {
        // This is a child operation of a parent
        context.parentContext = this.operationHierarchy.get(channel) || null
      } else {
        // This is a new top-level operation
        this.clearContext()
      }
    }

    this.activeContext = context

    this.emit(channel, {
      operation,
      status: 'running',
      message,
      progress: 0,
      metadata: {
        subOperations: subOperations.map((s) => s.channel),
        totalWeight
      }
    })
  }

  clearContext(): void {
    if (this.activeContext) {
      // Clean up channel mappings
      this.activeContext.subOperations.forEach((_, channel) => {
        this.channelMap.delete(channel)
      })
      this.activeContext = null
    }
  }

  private transformProgress(
    channel: ProgressChannel,
    progress?: number
  ): {
    channel: ProgressChannel
    progress?: number
    bubbleEvents: Array<{ channel: ProgressChannel; progress: number }>
  } {
    if (!progress || !this.activeContext) return { channel, progress, bubbleEvents: [] }

    const directContext = this.operationHierarchy.get(channel)
    if (!directContext) return { channel, progress, bubbleEvents: [] }

    // Calculate progress for the direct parent
    const subOp = directContext.subOperations.get(channel)
    if (!subOp) return { channel, progress, bubbleEvents: [] }

    const scaledDirectProgress = (progress / 100) * (subOp.weight / directContext.totalWeight) * 100
    const adjustedDirectProgress = subOp.progressOffset + scaledDirectProgress

    // Prepare to bubble up through all ancestors
    const bubbleEvents: Array<{ channel: ProgressChannel; progress: number }> = [
      {
        channel: directContext.channel,
        progress: Math.min(Math.round(adjustedDirectProgress), 100)
      }
    ]

    // Recursively bubble up to all parent contexts
    let currentContext = directContext.parentContext
    let currentProgress = adjustedDirectProgress

    while (currentContext) {
      const parentSubOp = currentContext.subOperations.get(directContext.channel)
      if (parentSubOp) {
        const scaledParentProgress =
          (currentProgress / 100) * (parentSubOp.weight / currentContext.totalWeight) * 100
        const adjustedParentProgress = parentSubOp.progressOffset + scaledParentProgress

        bubbleEvents.push({
          channel: currentContext.channel,
          progress: Math.min(Math.round(adjustedParentProgress), 100)
        })

        currentProgress = adjustedParentProgress
      }

      currentContext = currentContext.parentContext
    }

    return {
      channel,
      progress,
      bubbleEvents
    }
  }

  emit(channel: ProgressChannel, event: Omit<ProgressEvent, 'channel'>): boolean {
    const {
      channel: transformedChannel,
      progress: transformedProgress,
      bubbleEvents
    } = this.transformProgress(channel, event.progress)

    const finalEvent = {
      ...event,
      progress: transformedProgress,
      channel: transformedChannel
    }

    logger.debug(`Progress event: ${transformedChannel} - ${event.message}`, {
      domain: 'progress',
      source: 'progressBus'
    })

    // Emit the original event
    super.emit('progress', finalEvent)

    // Also emit all the bubbled up events to parent operations
    bubbleEvents.forEach((bubbleEvent) => {
      const bubbledFinalEvent = {
        ...event,
        progress: bubbleEvent.progress,
        channel: bubbleEvent.channel
      }

      super.emit('progress', bubbledFinalEvent)
    })

    return true
  }

  start(
    channel: ProgressChannel,
    operation: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const finalEvent = { operation, status: 'running' as const, message, metadata }

    this.channelOperationMap.set(channel, operation)

    this.emit(channel, finalEvent)
  }

  update(channel: ProgressChannel, message: string, progress?: number, operation?: string): void {
    if (!operation) {
      operation = this.channelOperationMap.get(channel) ?? ''
    } else {
      this.channelOperationMap.set(channel, operation)
    }

    const finalEvent = { operation, status: 'info' as const, message, progress }

    this.emit(channel, finalEvent)
  }

  complete(channel: ProgressChannel, message: string, operation?: string): void {
    if (!operation) {
      operation = this.channelOperationMap.get(channel) ?? ''
    } else {
      this.channelOperationMap.set(channel, operation)
    }

    const finalEvent = { operation, status: 'complete' as const, message, progress: 100 }

    if (this.activeContext && this.activeContext.channel === channel) {
      this.clearContext()
    }

    this.emit(channel, finalEvent)
  }

  error(channel: ProgressChannel, message: string, error?: string, operation?: string): void {
    if (!operation) {
      operation = this.channelOperationMap.get(channel) ?? ''
    } else {
      this.channelOperationMap.set(channel, operation)
    }

    const errorEvent = { operation, status: 'error' as const, message, error }

    if (this.activeContext && this.activeContext.channel === channel) {
      this.clearContext()
    }

    this.emit(channel, errorEvent)
  }
}

export const progressBus = ProgressEventBus.getInstance()

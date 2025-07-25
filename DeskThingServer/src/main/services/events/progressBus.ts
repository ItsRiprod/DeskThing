import { EventEmitter } from 'events'
import logger from '@server/utils/logger'
import { ProgressOperation, ProgressChannel, ProgressEvent, ProgressStatus } from '@shared/types'

class ProgressEventBus extends EventEmitter {
  private static instance: ProgressEventBus

  /**
   * The hierarchy of operations similar to a binary tree
   * Reverse maps Channels to their Operation parents
   */
  private operationHierarchy: Map<ProgressChannel, Set<ProgressOperation>> = new Map()

  /**
   * The map of the progress channels (i.e. simply just a key-val pair of channel name and progress %)
   */
  private channelProgressMap: Map<ProgressChannel, number> = new Map()

  /**
   * A quick way to get the last recorded status of a channel (i.e. info, complete, error, etc)
   */
  private channelStatusMap: Map<ProgressChannel, ProgressStatus> = new Map()

  /**
   * A quick way to get the last recorded operation string
   */
  private channelOperationMap: Map<ProgressChannel, string> = new Map()

  static getInstance(): ProgressEventBus {
    if (!ProgressEventBus.instance) {
      ProgressEventBus.instance = new ProgressEventBus()
    }
    return ProgressEventBus.instance
  }

  /**
   * Starts a new operation that can have sub-operations beneath it
   * @param channel
   * @param operation
   * @param message
   * @param subOperations
   */
  startOperation(
    channel: ProgressChannel,
    operation: string,
    message: string,
    subOperations: Array<{ channel: ProgressChannel; weight: number }> = []
  ): void {
    const operationContext: ProgressOperation = {
      channel,
      operation,
      message,
      status: ProgressStatus.RUNNING,
      subOperations: new Map(), // will be filled in later
      totalWeight: 0, // will be filled in later
      startTime: Date.now(),
      isLoading: true
    }

    let totalWeight = 0

    subOperations.forEach((sub) => {
      operationContext.subOperations.set(sub.channel, {
        weight: sub.weight,
        progress: 0
      })
      totalWeight += sub.weight

      // clear any existing sub-channel cache (lets it get re-created by the sub channel)
      this.channelProgressMap.delete(sub.channel)
      this.channelStatusMap.delete(sub.channel)
      this.channelOperationMap.delete(sub.channel)

      // Map child to parent context for proper bubbling
      if (!this.operationHierarchy.has(sub.channel)) {
        this.operationHierarchy.set(sub.channel, new Set([operationContext]))
      } else {
        this.operationHierarchy.get(sub.channel)?.add(operationContext)
      }
    })

    operationContext.totalWeight = totalWeight

    this.channelProgressMap.set(channel, 0)
    this.channelStatusMap.set(channel, ProgressStatus.RUNNING)

    this.emit(channel, {
      ...operationContext,
      metadata: {
        subOperations: subOperations.map((s) => s.channel),
        totalWeight
      }
    })
  }

  /**
   * Provides cleanup operation logic for once it has been completed
   */
  private completeOperation(event: ProgressEvent | ProgressOperation): void {
    const finalProgress = Math.min(100, this.channelProgressMap.get(event.channel) || 0)
    // mark it as complete
    this.channelStatusMap.set(event.channel, ProgressStatus.COMPLETE)

    // set the progress to 100
    this.channelProgressMap.set(event.channel, finalProgress)

    // remove it from the channelOperationMap
    this.channelOperationMap.delete(event.channel)

    // If this is an operation - handle its sub operations
    if ('subOperations' in event) {
      event.subOperations.forEach((_subOp, subChannel) => {
        // Remove it from the operation hierarchy
        this.operationHierarchy.get(subChannel)?.delete(event)

        // delete any channels that are empty as well
        if (this.operationHierarchy.get(subChannel)?.size === 0) {
          this.operationHierarchy.delete(subChannel)
        }
        this.complete(subChannel)
      })

      event.subOperations.clear()
    }

    // If this operation is a sub-operation of another operation - remove it from that one
    const parentOperations = this.operationHierarchy.get(event.channel)
    if (parentOperations) {
      parentOperations.forEach((parentOp) => {
        if ('subOperations' in parentOp) {
          const subOp = parentOp.subOperations.get(event.channel)
          if (subOp) {
            parentOp.subOperations.set(event.channel, {
              weight: subOp.weight,
              progress: finalProgress // Ensure it has the final progress value
            })
          }
        }
      })

      // Clear this channel's hierarchy
      this.operationHierarchy.delete(event.channel)
    }
  }

  /**
   * Handles propogating the progress of a specific channel up to the parent-channels
   */
  private getParentOperationChannels = (
    event: ProgressEvent
  ): Set<ProgressOperation> | undefined => {
    const parentOperations = this.operationHierarchy.get(event.channel)
    if (!parentOperations) return // no bubbling needed (top level event)

    const transformedOperations = new Set<ProgressOperation>()

    // update the parent operations with the new progress
    parentOperations.forEach((parentOp) => {
      const operationalContext = parentOp.subOperations.get(event.channel)

      if (operationalContext && event.progress != undefined) {
        parentOp.subOperations.set(event.channel, {
          weight: operationalContext.weight,
          progress: event.progress
        })
      }
      parentOp.message = event.message
      parentOp.operation = event.operation

      // Calculate weighted progress for the parent operation
      let totalWeightedProgress = 0
      const totalWeight = parentOp.totalWeight || 1 // Prevent division by zero

      parentOp.subOperations.forEach((subOp) => {
        // Calculate weighted contribution: (progress * weight) / totalWeight * 100
        const weightedContribution = (subOp.progress * subOp.weight) / totalWeight
        totalWeightedProgress += weightedContribution
      })

      // Ensure progress doesn't exceed 100%
      parentOp.progress = Math.min(100, totalWeightedProgress)

      transformedOperations.add(parentOp)
    })

    // return the new progresses
    return transformedOperations
  }
  private syncStatusMaps = (event: ProgressEvent): void => {
    if (event.progress) {
      this.channelProgressMap.set(event.channel, Math.min(100, event.progress))
    }

    if (event.status == ProgressStatus.COMPLETE || event.status == ProgressStatus.ERROR) {
      this.channelProgressMap.set(event.channel, 100)
    }

    if (event.status) {
      this.channelStatusMap.set(event.channel, event.status)
    }

    if (event.operation) {
      this.channelOperationMap.set(event.channel, event.operation)
    }
  }

  /**
   * Emits to all listeners of the progress bus as well as updates any parent channels of updates
   * @param channel
   * @param event
   * @returns
   */
  emit<T extends ProgressChannel>(
    channel: T,
    event: Extract<ProgressEvent, { channel: T }>
  ): boolean {
    // first sync the constants
    this.syncStatusMaps(event)

    event.timestamp = event.timestamp || Date.now()

    // Emit the event
    super.emit('progress', event)

    // get parent operations
    const operations = this.getParentOperationChannels(event)

    event.progress = this.channelProgressMap.get(channel) || 0

    // top level operation
    if (!operations) {
      const logString = `(${event.progress}%) ${event.operation} - ${event.message}`
      switch (event.status) {
        case ProgressStatus.ERROR:
          logger.error(logString, {
            function: event.channel,
            source: 'Progress'
          })
          break
        case ProgressStatus.WARN:
          logger.warn(logString, {
            function: event.channel,
            source: 'Progress'
          })
          break
        case ProgressStatus.COMPLETE:
        case ProgressStatus.RUNNING:
        case ProgressStatus.SUCCESS:
        case ProgressStatus.INFO:
          logger.info(logString, {
            function: event.channel,
            source: 'Progress'
          })
          break
        default:
          logger.warn(`Unknown Status: ${event.status}!!\n` + logString, {
            function: event.channel,
            source: 'Progress'
          })
          break
      }
      return true
    } else {
      logger.debug(`(${event.progress}%) ${event.operation} - ${event.message}`, {
        function: event.channel,
        source: 'Progress'
      })
    }

    // parent-operation propagation
    operations.forEach((operation) => {
      // recursively emit this operation

      // ensure that errors are bubbled as warnings
      if (operation.status == ProgressStatus.ERROR) {
        operation.status = ProgressStatus.WARN
      }

      this.emit(operation.channel, operation)

      // Check if the operation is complete
      if (operation.progress != undefined && operation.progress >= 100) {
        this.completeOperation(operation)
      }
    })

    return true
  }

  /**
   * Starts a new operation that doesn't have any sub-operations
   * @param channel - the channel to start the operation on
   * @param operation - the name of the operation only used in the frontend and any following progress updates
   * @param message - the message to be displayed under the operation - usually more details
   * @param metadata - any additional metadata to be stored with the operation
   * @returns a function to update progress with on the specified channel
   */
  start(
    channel: ProgressChannel,
    operation: string,
    message: string,
    metadata?: Record<string, unknown>
  ): (message: string, progress?: number, operation?: string) => void {
    const finalEvent: ProgressEvent = {
      operation,
      status: ProgressStatus.RUNNING,
      message,
      progress: 0,
      metadata,
      isLoading: true,
      channel
    }

    this.emit(channel, finalEvent)
    return (message: string, progress?: number, operation?: string) => {
      this.update(channel, message, progress, operation)
    }
  }

  /**
   * Used to update the progress / event / message of a channel
   * @param channel - the channel to update the progress of
   * @param message - the message to be displayed under the operation - usually more details
   * @param progress - the progress of the operation - should be a value between 0 and 100
   * @param operation - the name of the operation only used in the frontend and any following progress updates
   */
  update(channel: ProgressChannel, message: string, progress?: number, operation?: string): void {
    if (!operation) {
      operation = this.channelOperationMap.get(channel) ?? ''
    }

    if (progress !== undefined) {
      // Enforce 100% limit
      const limitedProgress = Math.min(100, Math.max(0, progress))
      this.channelProgressMap.set(channel, limitedProgress)
    } else {
      progress = this.channelProgressMap.get(channel) ?? 0
    }

    const finalEvent: ProgressEvent = {
      operation,
      status: ProgressStatus.INFO,
      message,
      isLoading: true,
      progress,
      channel
    }

    this.emit(channel, finalEvent)
  }

  /**
   * Increments the progress of a running operation by a given amount
   * @param channel - the channel to increment the progress of
   * @param message - the message to be displayed under the operation - usually more details
   * @param increment - the amount to increment the progress by from 0 - 100
   * @param operation - the name of the operation only used in the frontend and any following progress updates
   */
  incrementProgress(
    channel: ProgressChannel,
    message: string,
    increment: number,
    operation?: string
  ): void {
    const currentProgress = this.channelProgressMap.get(channel) ?? 0
    const newProgress = Math.min(100, currentProgress + increment)
    this.update(channel, message, newProgress, operation)
  }

  warn(channel: ProgressChannel, message: string, error?: string, operation?: string): void {
    if (!operation) {
      operation = this.channelOperationMap.get(channel) ?? ''
    }

    if (error) {
      logger.error(`Error while completing ${channel}. Message: ${error}`, {
        source: channel,
        function: 'error'
      })
    }

    const finalEvent: ProgressEvent = {
      operation,
      status: ProgressStatus.WARN,
      isLoading: true,
      message,
      channel
    }

    this.emit(channel, finalEvent)
  }

  complete(channel: ProgressChannel, message?: string, operation?: string): void {
    if (!operation) {
      operation = this.channelOperationMap.get(channel) ?? ''
    } else {
      this.channelOperationMap.set(channel, operation)
    }

    const finalEvent: ProgressEvent = {
      operation,
      status: ProgressStatus.COMPLETE,
      message: message ?? operation,
      isLoading: false,
      progress: 100,
      channel
    }

    this.emit(channel, finalEvent)
  }

  error(channel: ProgressChannel, message: string, error?: string, operation?: string): void {
    if (!operation) {
      operation = this.channelOperationMap.get(channel) ?? ''
    } else {
      this.channelOperationMap.set(channel, operation)
    }

    const errorEvent: ProgressEvent = {
      operation,
      status: ProgressStatus.ERROR,
      message,
      error,
      isLoading: false,
      progress: 100,
      channel
    }

    if (error) {
      logger.error(`Error while completing ${channel}. Message: ${error}`, {
        source: channel,
        function: 'error',
        error: new Error(error)
      })
    }

    this.emit(channel, errorEvent)
  }
}

export const progressBus = ProgressEventBus.getInstance()

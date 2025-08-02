import { NotificationMessage } from '@deskthing/types'
import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore } from '@shared/types'
import EventEmitter from 'node:events'

export type NotificationStoreEvents = {
  notificationList: [Record<string, NotificationMessage>]
  notification: [NotificationMessage]
  acknowledged: [{ id: string; notification: NotificationMessage }]
}

export interface NotificationStoreClass
  extends CacheableStore,
    StoreInterface,
    EventEmitter<NotificationStoreEvents> {
  addNotification<T extends NotificationMessage>(
    notification: T,
    callback?: (notification: T) => void
  ): Promise<void>
  deleteNotification(id: string): Promise<void>
  getNotification(id: string): Promise<NotificationMessage | undefined>
  getNotificationList(): Promise<Record<string, NotificationMessage>>
  acknowledgeNotification(
    notification: Partial<NotificationMessage> & { id: string }
  ): Promise<void>
  checkForNotifications(): Promise<void>
}

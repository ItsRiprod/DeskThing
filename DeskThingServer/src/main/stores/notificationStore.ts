import { NotificationMessage } from '@deskthing/types'
import { NotificationStoreEvents, NotificationStoreClass } from '@shared/stores/notificationStore'
import { EventEmitter } from 'node:events'
import { storeProvider } from './storeProvider'
import logger from '@server/utils/logger'

export class NotificationStore
  extends EventEmitter<NotificationStoreEvents>
  implements NotificationStoreClass
{
  private notifications: Record<string, NotificationMessage> = {}

  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }
  public initialize(): Promise<void> {
    if (this.initialized) return Promise.resolve()

    // Initialize the store
    this._initialized = true
    this.emit('notificationList', { ...this.notifications })
    return Promise.resolve()
  }

  constructor() {
    super()
  }

  clearCache = async (): Promise<void> => {
    // Emit each notification before clearing
    Object.values(this.notifications).forEach((notification) => {
      this.emit('acknowledged', { id: notification.id, notification })
    })
    this.notifications = {}
    this.emit('notificationList', { ...this.notifications })
  }

  saveToFile = async (): Promise<void> => {
    // nothing is saved to file
  }

  // CRUD operations
  async addNotification<T extends NotificationMessage>(
    notification: T,
    callback?: (notification: T) => void | Promise<void>
  ): Promise<void> {
    // if the notification already exists, dont add it - skip over these and group the callback in with everything else
    if (!this.notifications[notification.id]) {
      this.notifications[notification.id] = notification
      this.emit('notification', notification)
      this.emit('notificationList', { ...this.notifications })
    }

    if (!callback) return // ignore messages that dont have a callback

    const listener = async (notif: {
      id: string
      notification: NotificationMessage
    }): Promise<void> => {
      if (notif.id != notification.id) return
      // if the notification id matches, we can call the callback
      await callback?.(notif.notification as T)

      this.off('acknowledged', listener)
    }

    this.on('acknowledged', listener)
  }

  async deleteNotification(id: string): Promise<void> {
    if (!this.notifications[id]) return
    delete this.notifications[id]
  }

  async getNotification(id: string): Promise<NotificationMessage | undefined> {
    return this.notifications[id]
  }

  async getNotificationList(): Promise<Record<string, NotificationMessage>> {
    return { ...this.notifications }
  }

  // Acknowledge notification
  async acknowledgeNotification(
    notification: Partial<NotificationMessage> & { id: string }
  ): Promise<void> {
    if (!this.notifications[notification.id]) return

    const updatedNotification = {
      ...this.notifications[notification.id], // setup the notif
      ...notification, // apply changes/updates
      acknowledged: true // acknowledge
    } as NotificationMessage

    delete this.notifications[notification.id] // delete the old notification

    this.emit('acknowledged', { id: notification.id, notification: updatedNotification })
    this.emit('notificationList', this.notifications)
  }

  async checkForNotifications(): Promise<void> {
    // This method can be used to check for notifications from a remote source
    const settingsStore = await storeProvider.getStore('settingsStore')

    const checkNerdMode = async (): Promise<void> => {
      const nerdModeState = await settingsStore.getSetting('flag_nerd')

      if (nerdModeState) return // user has already modified this setting

      const isNerdModeAcknowledged = await settingsStore.getFlag('nerdModeAcknowledged')

      if (isNerdModeAcknowledged) return // user has already acknowledged this setting

      this.addNotification(
        {
          id: 'nerdModeActive',
          title: 'Advanced Settings Disabled',
          source: 'server',
          description:
            'Advanced Mode is currently disabled by default, do you want to keep it this way?',
          type: 'yesno',
          acknowledged: false,
          response: true
        },
        async (notification) => {
          // first, ensure it has been acknowledged - i.e. not ignored
          if (notification.acknowledged) {
            await settingsStore.setFlag('nerdModeAcknowledged', true)

            // Nerd mode is opposite of the response (yes i want to keep it this way -> keep nerd mode disabled)
            await settingsStore.saveSetting('flag_nerd', !notification.response)
          }
        }
      )
    }

    await checkNerdMode()

    if (process.env.NODE_ENV === 'development') {
      await this.addAllNotificationTypes() // add this when debugging notification styles
    }

    return Promise.resolve()
  }

  private addAllNotificationTypes = async (): Promise<void> => {
    // YesNo notification
    await this.addNotification(
      {
        id: 'testYesNo',
        title: 'YesNo Test Notification',
        source: 'server',
        description: 'Testing the YesNo type of notification. Do you want to proceed?',
        type: 'yesno',
        acknowledged: false,
        response: true
      },
      async (notification) => {
        if (notification.acknowledged) {
          logger.debug(
            `Just acknowledged notification: ${notification.id} with response: ${notification.response}`
          )
        }
      }
    )

    // Acknowledge notification (with link)
    await this.addNotification({
      id: 'testAcknowledgeLink',
      title: 'Acknowledge Notification (with link)',
      source: 'server',
      description: 'Please acknowledge this notification. Click the link for more info.',
      type: 'acknowledge',
      acknowledged: false,
      action_label: 'Acknowledge',
      link: 'https://example.com/info'
    })

    // Acknowledge notification (without link)
    await this.addNotification({
      id: 'testAcknowledgeNoLink',
      title: 'Acknowledge Notification (no link)',
      source: 'server',
      description: 'Please acknowledge this notification.',
      type: 'acknowledge',
      acknowledged: false,
      action_label: 'Acknowledge'
    })

    // Confirm notification
    await this.addNotification({
      id: 'testConfirm',
      title: 'Confirm Notification',
      source: 'server',
      description: 'Do you confirm this action?',
      type: 'confirm',
      acknowledged: false,
      action_label: 'Confirm'
    })

    // Text notification (with link)
    await this.addNotification({
      id: 'testTextLink',
      title: 'Text Notification (with link)',
      source: 'server',
      description: 'Please provide your feedback. More info at the link.',
      type: 'text',
      acknowledged: false,
      link: 'https://example.com/feedback'
    })

    // Text notification (without link)
    await this.addNotification({
      id: 'testTextNoLink',
      title: 'Text Notification (no link)',
      source: 'server',
      description: 'Please provide your feedback.',
      type: 'text',
      acknowledged: false
    })

    // Passive notification
    await this.addNotification({
      id: 'testPassive',
      title: 'Passive Notification',
      source: 'server',
      description: 'This is a passive notification.',
      type: 'passive',
      acknowledged: false
    })

    // Error notification (with link)
    await this.addNotification({
      id: 'testErrorLink',
      title: 'Error Notification (with link)',
      source: 'server',
      description: 'An error occurred. See details.',
      type: 'error',
      acknowledged: false,
      link: 'https://example.com/error-details'
    })

    // Warning notification
    await this.addNotification({
      id: 'testWarning',
      title: 'Warning Notification',
      source: 'server',
      description: 'This is a warning notification.',
      type: 'warning',
      acknowledged: false
    })

    // Info notification (with link)
    await this.addNotification({
      id: 'testInfoLink',
      title: 'Info Notification (with link)',
      source: 'server',
      description: 'Here is some information. Click for more.',
      type: 'info',
      acknowledged: false,
      link: 'https://example.com/info'
    })
  }
}

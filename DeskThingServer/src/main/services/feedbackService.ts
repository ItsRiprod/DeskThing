import { ClientConnectionMethod, LOGGING_LEVELS } from '@deskthing/types'
import { storeProvider } from '@server/stores/storeProvider'
import { handleError } from '@server/utils/errorHandler'
import logger from '@server/utils/logger'
import { DiscordWebhookData, FeedbackReport, FeedbackResult, FeedbackType, SystemInfo } from '@shared/types'
import os from 'os'

export class FeedbackService {
  private static readonly SUBMISSION_ID = Math.floor(Math.random() * 900) + 100

  /**
   * This will be updated later for an actual webhook edge server smth smth fancy instead of directly to the discord channel
   * If you could be a real one and not abuse this, that would be awesome. Thanks!
   */
  private static readonly WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'fallback-webhook-url'

  private static readonly TYPE_COLORS: Record<FeedbackType, number> = {
    bug: 0xff0000,
    feature: 0x00ff00,
    question: 0x0000ff,
    other: 0x808080
  }

  static getEmojiForType(type: FeedbackType): string {
    switch (type) {
      case 'bug':
        return ':bug:'
      case 'feature':
        return ':rocket:'
      case 'question':
        return ':question:'
      case 'other':
        return ':shrug:'
    }
  }

  static async sendFeedback(report: FeedbackReport): Promise<FeedbackResult> {
    const systemInfo = report.type === 'bug' || report.type === 'other' ? report.feedback : null

    const enrichedReport = await this.enrichFeedbackData(report)

    const message: DiscordWebhookData = {
      content: `[${this.SUBMISSION_ID}] **New ${report.type.toUpperCase()} Feedback** ${this.getEmojiForType(report.type)}`,
      embeds: [
        {
          title: `${enrichedReport.feedback.title} - ${enrichedReport.type.toUpperCase()}`,
          description: enrichedReport.feedback.feedback,
          color: this.TYPE_COLORS[enrichedReport.type],
          author: {
            name: enrichedReport.feedback.discordId || 'Anonymous User'
          },
          fields: await this.generateFields(enrichedReport, systemInfo),
          timestamp: new Date().toISOString()
        }
      ]
    }

    logger.debug(`Sending feedback to Discord: ${JSON.stringify(message)}`)

    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      })

      if (!response.ok) {
        throw new Error(`Failed to send feedback: ${response.statusText}`)
      }
      return {
        message: 'Feedback sent successfully',
        success: true
      }
    } catch (error) {
      logger.error('Error sending feedback:', { source: 'feedbackService', error: error as Error })
      return {
        message: 'Failed to send feedback',
        success: false,
        error: handleError(error)
      }
    }
  }

  private static async enrichFeedbackData(report: FeedbackReport): Promise<FeedbackReport> {
    // Enrich basic fields
    report.feedback.timestamp = report.feedback.timestamp || new Date().toISOString()

    // System information
    if (report.type === 'bug' || report.type === 'other') {
      const sysInfo = await this.collectSystemInfo()

      report.feedback.serverVersion =
        report.feedback.serverVersion || sysInfo.serverVersion || '0.0.0'
      report.feedback.clientVersion =
        report.feedback.clientVersion || sysInfo.clientVersion || '0.0.0'
      report.feedback.os = report.feedback.os || sysInfo.os
      report.feedback.cpu = report.feedback.cpu || sysInfo.cpu
      report.feedback.uptime = report.feedback.uptime || sysInfo.uptime

      // Get running apps information
      if (!report.feedback.apps || report.feedback.apps.length === 0) {
        report.feedback.apps = sysInfo.apps
      }

      // Get connected clients
      if (!report.feedback.clients || report.feedback.clients.length === 0) {
        report.feedback.clients = sysInfo.clients
      }

      // Set default reproduce steps if none provided
      report.feedback.reproduce = report.feedback.reproduce || []
      report.feedback.expected = report.feedback.expected || 'No expected behavior provided'
      report.feedback.actual = report.feedback.actual || 'No actual behavior provided'
    }

    return report
  }

  static async collectSystemInfo(): Promise<SystemInfo> {
    const appStore = await storeProvider.getStore('appStore')
    const platformStore = await storeProvider.getStore('platformStore')
    const clientStore = await storeProvider.getStore('clientStore')

    const systemInfo: SystemInfo = {
      serverVersion: 'v' + process.env.PACKAGE_VERSION || '0.0.0',
      clientVersion: (await clientStore.getClient())?.version || '0.0.0',
      os: `${os.platform()} ${os.release()}`,
      cpu: os.cpus()[0].model,
      ram: Math.round(os.totalmem() / (1024 * 1024)) + ' MB',
      uptime: Math.floor(process.uptime()),
      freeRam: Math.round(os.freemem() / (1024 * 1024)) + ' MB',
      arch: os.arch(),
      loadAverage: os.loadavg(),
      apps: [],
      clients: [],
      recentLogs: []
    }

    const runningApps = await appStore.getAllBase()
    systemInfo.apps = runningApps.map((app) => ({
      name: app.name,
      version: app.manifest?.version || '0.0.0',
      running: app.running || false,
      enabled: app.enabled || false,
      runningDuration: app.timeStarted
        ? this.formatDuration(Date.now() - app.timeStarted)
        : 'unknown'
    }))

    // Get connected clients
    const connectedClients = await platformStore.getClients()
    systemInfo.clients = connectedClients.map((client) => ({
      name: client.manifest?.name || 'Unknown Device',
      connectionType: ClientConnectionMethod[client.manifest?.context.method || 0],
      deviceType: client.manifest?.context?.name || 'unknown',
      connectionDuration: client.timestamp
        ? this.formatDuration(Date.now() - client.timestamp)
        : 'unknown'
    }))

    const logs = await logger.getLogs(7)

    systemInfo.recentLogs = logs
      .map(
        (log) =>
          `${this.getLogColor(log.type)}[${log.options.date && new Date(log.options.date).toLocaleString()}:${log.type}] ${log.options.source}.${log.options.function} ${log.log.substring(0, 100)}\u001b[0m`
      )
      .slice(0, 7)

    return systemInfo
  }
  private static getLogColor(type: LOGGING_LEVELS): string {
    switch (type) {
      case LOGGING_LEVELS.ERROR:
        return '\u001b[31m' // Red
      case LOGGING_LEVELS.WARN:
        return '\u001b[33m' // Yellow
      case LOGGING_LEVELS.FATAL:
        return '\u001b[32m' // Green
      case LOGGING_LEVELS.DEBUG:
        return '\u001b[34m' // Blue
      case LOGGING_LEVELS.LOG:
        return '\u001b[37m' // White
      default:
        return '\u001b[37m' // White
    }
  }

  private static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h` : minutes > 0 ? `${minutes}m` : `${seconds}s`
  }

  private static async generateFields(
    report: FeedbackReport,
    feedbackSysInfo: SystemInfo | null
  ): Promise<Array<{ name: string; value: string; inline: boolean }>> {
    const systemInfo = { ...(await this.collectSystemInfo()), ...feedbackSysInfo }

    const fields = [
      {
        name: 'Timestamp',
        value: report.feedback.timestamp || new Date().toISOString(),
        inline: true
      },
      {
        name: 'Discord ID',
        value: report.feedback.discordId || 'Not provided',
        inline: true
      },
      {
        name: 'Type',
        value: report.type,
        inline: true
      }
    ]

    if (report.type === 'bug' || report.type === 'other') {
      const detailedInfo = report.feedback
      fields.push(
        {
          name: 'Steps to Reproduce',
          value:
            detailedInfo.reproduce && detailedInfo.reproduce.length > 0
              ? `1. ${detailedInfo.reproduce[0]}\n- ${detailedInfo.reproduce.slice(1).join('\n- ')}`
              : 'Not provided',
          inline: false
        },
        {
          name: 'Expected Behavior',
          value: detailedInfo.expected || 'Not provided',
          inline: true
        },
        {
          name: 'Actual Behavior',
          value: detailedInfo.actual || 'Not provided',
          inline: true
        }
      )

      if (systemInfo) {
        fields.push({
          name: 'System Information',
          value: [
            `Server Version: ${systemInfo.serverVersion}`,
            `Client Version: ${systemInfo.clientVersion}`,
            `OS: ${systemInfo.os}`,
            `CPU: ${systemInfo.cpu}`,
            `RAM: ${systemInfo.ram}`,
            `Free RAM: ${systemInfo.freeRam}`,
            `Architecture: ${systemInfo.arch}`,
            `Load Average: ${systemInfo.loadAverage?.join(', ')}`,
            `Page: ${systemInfo.page}`,
            `Uptime: ${systemInfo.uptime}s`
          ].join('\n'),
          inline: false
        })
        systemInfo.apps &&
          fields.push({
            name: 'Apps',
            value:
              systemInfo.apps
                .map(
                  (app) =>
                    `${app.name} v${app.version} (${app.running ? 'Running' : 'Stopped'}, ${app.enabled ? 'Enabled' : 'Disabled'}, ${app.runningDuration})`
                )
                .join('\n') || 'No apps',
            inline: false
          })
        systemInfo.clients &&
          fields.push({
            name: 'Clients',
            value:
              systemInfo.clients
                .map(
                  (client) =>
                    `${client.name} - ${client.connectionType} on ${client.deviceType} (${client.connectionDuration})`
                )
                .join('\n') || 'No clients',
            inline: false
          })
      }
    }

    if (systemInfo && systemInfo.recentLogs && systemInfo.recentLogs.length > 0) {
      fields.push({
        name: 'Recent Logs',
        value:
          '```ansi\n' +
          systemInfo.recentLogs.slice(0, 10).join('\n') +
          (systemInfo.recentLogs.length > 10
            ? '\n... and ' + (systemInfo.recentLogs.length - 10) + ' more'
            : '') +
          '\n```',
        inline: false
      })
    }

    return fields
  }
}

// // Test Cases
// const partialReport: FeedbackReport = {
//   type: 'bug',
//   feedback: {
//     title: 'App Crashes on Startup',
//     feedback: 'The application crashes immediately after launching'
//   }
// }
// const bugReport: FeedbackReport = {
//   type: 'bug',
//   feedback: {
//     title: 'App Crashes on Startup',
//     feedback: 'The application crashes immediately after launching',
//     timestamp: '2024-01-20T10:00:00Z',
//     discordId: '123456789',
//     reproduce: ['1. Open the app', '2. Wait for loading screen', '3. Crash occurs'],
//     expected: 'App should launch normally',
//     actual: 'App crashes immediately',
//     serverVersion: '1.2.3',
//     clientVersion: '1.0.0',
//     os: 'Windows 11',
//     cpu: 'Intel i7',
//     page: '/home',
//     uptime: 120,
//     apps: [
//       {
//         name: 'Discord',
//         version: '1.0.0',
//         running: true,
//         enabled: true,
//         runningDuration: 900
//       },
//       {
//         name: 'Spotify',
//         version: '0.5.0',
//         running: false,
//         enabled: true,
//         runningDuration: 5000
//       }
//     ],
//     clients: [
//       { name: 'Desktop', connectionType: 'direct', deviceType: 'windows', connectionDuration: '2h' }
//     ]
//   }
// }

// const featureReport: FeedbackReport = {
//   type: 'feature',
//   feedback: {
//     title: 'Add Dark Mode',
//     feedback: 'Please add a dark mode option',
//     timestamp: '2024-01-20T11:00:00Z',
//     discordId: '987654321'
//   }
// }

// const questionReport: FeedbackReport = {
//   type: 'question',
//   feedback: {
//     title: 'How to Configure Settings',
//     feedback: 'Where can I find the advanced settings?',
//     timestamp: '2024-01-20T12:00:00Z',
//     discordId: '456789123'
//   }
// }

// const otherReport: FeedbackReport = {
//   type: 'other',
//   feedback: {
//     title: 'General Feedback',
//     feedback: 'The UI looks great!',
//     timestamp: '2024-01-20T13:00:00Z',
//     discordId: '789123456',
//     reproduce: ['N/A'],
//     expected: 'N/A',
//     actual: 'N/A',
//     serverVersion: '1.2.3',
//     clientVersion: '1.0.0',
//     os: 'MacOS',
//     cpu: 'M1',
//     page: '/settings',
//     uptime: 300,
//     apps: [],
//     clients: []
//   }
// }

// FeedbackService.sendFeedback(bugReport)
// FeedbackService.sendFeedback(featureReport)
// FeedbackService.sendFeedback(questionReport)
// FeedbackService.sendFeedback(otherReport)
// FeedbackService.sendFeedback(partialReport)

/* eslint-disable @typescript-eslint/no-unused-vars */
import { getClientManifest } from '@server/handlers/deviceHandler'
import { appStore, connectionStore } from '@server/stores'
import { FeedbackReport, FeedbackType, SystemInfo } from '@shared/types'
import os from 'os'

export class FeedbackService {
  private static readonly WEBHOOK_URL =
    'https://canary.discord.com/api/webhooks/1333299869846339646/rXI5WwBg8EZMztU0XhvuPhd1GG3K_09U_anoJvK0QN4Kc5bSSMN2nwBvkNQU2G-_74k0'

  private static readonly TYPE_COLORS: Record<FeedbackType, number> = {
    bug: 0xff0000,
    feature: 0x00ff00,
    question: 0x0000ff,
    other: 0x808080
  }

  static async sendFeedback(report: FeedbackReport): Promise<void> {
    const systemInfo = report.type === 'bug' || report.type === 'other' ? report.feedback : null

    const enrichedReport = await this.enrichFeedbackData(report)

    const message = {
      content: '**New Feedback Received**',
      embeds: [
        {
          title: `${enrichedReport.feedback.title} - ${enrichedReport.type.toUpperCase()}`,
          description: enrichedReport.feedback.feedback,
          color: this.TYPE_COLORS[enrichedReport.type],
          fields: this.generateFields(enrichedReport, systemInfo),
          timestamp: new Date().toISOString()
        }
      ]
    }

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
    } catch (error) {
      console.error('Error sending feedback:', error)
      throw error
    }
  }

  private static async enrichFeedbackData(report: FeedbackReport): Promise<FeedbackReport> {
    // Enrich basic fields
    report.feedback.timestamp = report.feedback.timestamp || new Date().toISOString()

    // System information
    if (report.type === 'bug' || report.type === 'other') {
      report.feedback.serverVersion =
        report.feedback.serverVersion || 'v' + process.env.npm_package_version || '0.0.0'
      report.feedback.clientVersion =
        report.feedback.clientVersion || (await getClientManifest())?.version || '0.0.0'
      report.feedback.os = report.feedback.os || `${os.platform()} ${os.release()}`
      report.feedback.cpu = report.feedback.cpu || os.cpus()[0].model
      report.feedback.uptime = report.feedback.uptime || Math.floor(process.uptime())

      // Get running apps information
      if (!report.feedback.apps || report.feedback.apps.length === 0) {
        const runningApps = await appStore.getAllBase()
        report.feedback.apps = runningApps.map((app) => ({
          name: app.name,
          version: app.manifest?.version || '0.0.0',
          running: app.running || false,
          enabled: app.enabled || false,
          runningDuration: app.timeStarted ? Date.now() - app.timeStarted : 0
        }))
      }

      // Get connected clients
      if (!report.feedback.clients || report.feedback.clients.length === 0) {
        const connectedClients = await connectionStore.getClients()
        report.feedback.clients = connectedClients.map((client) => ({
          name: client.client_name || 'Unknown Device',
          connectionType: client.ip || 'direct',
          deviceType: client.device_type?.name || 'unknown',
          connectionDuration: client.timestamp
            ? this.formatDuration(Date.now() - client.timestamp)
            : 'unknown'
        }))
      }

      // Set default reproduce steps if none provided
      report.feedback.reproduce = report.feedback.reproduce || []
      report.feedback.expected = report.feedback.expected || 'No expected behavior provided'
      report.feedback.actual = report.feedback.actual || 'No actual behavior provided'
    }

    return report
  }

  private static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h` : minutes > 0 ? `${minutes}m` : `${seconds}s`
  }

  private static generateFields(
    report: FeedbackReport,
    systemInfo: SystemInfo | null
  ): Array<{ name: string; value: string; inline: boolean }> {
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
                    `${app.name} v${app.version} (${app.running ? 'Running' : 'Stopped'}, ${app.enabled ? 'Enabled' : 'Disabled'}, ${app.runningDuration}ms)`
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

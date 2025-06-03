/** Operating system types */
type HostOs = 'linux' | 'windows' | 'macos'

/** uniquely identifies the machine on which deskthing was installed. this object should only ever be sent once. */
export interface Registration {
  id: string
  publicKey: string
  os: HostOs
  cpus?: number
  memory?: number
}

/** the most recent of this object identifies the current server version. this can be sent multiple times.
 * a new version is assumed to be an upgrade or downgrade of the server. this object should be sent once per
 * server version, such as directly post-installation or when the server is updated. */
interface Server {
  version: string
}

/** the most recent of this object identifies the current client version for `clientId`. this can be sent multiple times.
 * a new version is assumed to be an upgrade or downgrade of the client. this object should be sent once per client
 * per client version, such as directly post-installation or when the client is updated. */
interface Client {
  clientId: string
  version: string
}

/** union that disambiguates the subject of the system and installation statistics */
type SystemStats = { type: 'server'; data: Server } | { type: 'client'; data: Client }

/** stats that may change between times the app is opened */
interface OpenStats {
  timezone: string
}

/** stats about the application session when the app is closed */
interface CloseStats {
  uptime: number
}

/** stats about resource usage */
interface ResourceUsage {
  cpu: number
  memory: number
}

/** records general usage - time here is amount of time spent in the app while focused in seconds */
interface GeneralUsage {
  time: number
}

/** records ongoing usage of deskthing */
type UsageStats =
  | { type: 'open'; data: OpenStats }
  | { type: 'close'; data: CloseStats }
  | { type: 'resource'; data: ResourceUsage }
  | { type: 'general'; data: GeneralUsage }

/** records an installation of the app `id` */
interface AppInstall {
  appId: string
}

/** records an update of the app `id` */
interface AppUpdate {
  appId: string
  currentVersion: string
  newVersion: string
}

/** records an uninstallation of the app `id` */
interface AppUninstall {
  appId: string
}

/** records a summary of the app installation statistics */
interface AppSummary {
  count: number
}

/** union that disambiguates the subject of the app statistics */
type AppStats =
  | { type: 'install'; data: AppInstall }
  | { type: 'update'; data: AppUpdate }
  | { type: 'uninstall'; data: AppUninstall }
  | { type: 'summary'; data: AppSummary }

/** record values of interesting settings, preferences, and other easy k/v data */
type KvStats =
  | { type: 'boolean'; key: string; value: boolean }
  | { type: 'number'; key: string; value: number }
  | { type: 'string'; key: string; value: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'json'; key: string; value: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'array'; key: string; value: any[] }

/** union of all deskthing stats */
export type Stat =
  | ({ stat: 'system' } & SystemStats)
  | ({ stat: 'app' } & AppStats)
  | ({ stat: 'kv' } & KvStats)
  | ({ stat: 'usage' } & UsageStats)

/** stats object */
export type Stats = Stat[]

export const statTypes = {
  system: ['server', 'client'] as const,
  app: ['install', 'update', 'uninstall', 'summary'] as const,
  usage: ['open', 'close', 'resource', 'general'] as const,
  kv: ['boolean', 'number', 'string', 'json', 'array'] as const
} as const
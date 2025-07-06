interface BaseFeedback {
  timestamp?: string
  title: string
  feedback: string
  discordId?: string
}

export interface SystemInfo {
  serverVersion?: string
  clientVersion?: string
  apps?: Array<{
    name: string
    version: string
    running: boolean
    enabled: boolean
    runningDuration: string
  }>
  clients?: Array<{
    name: string
    connectionType: string
    deviceType: string
    connectionDuration: string
  }>
  os?: string
  cpu?: string
  ram?: string
  page?: string
  uptime?: number
  freeRam?: string
  arch?: string
  loadAverage?: number[]
  recentLogs?: string[]
}

interface DetailedFeedback extends BaseFeedback {
  reproduce?: string[]
  expected?: string
  actual?: string
}

interface BugFeedback extends DetailedFeedback, SystemInfo {}

type FeatureFeedback = BaseFeedback

type QuestionFeedback = BaseFeedback

interface OtherFeedback extends DetailedFeedback, SystemInfo {}

export type FeedbackType = 'bug' | 'feature' | 'question' | 'other'

export type FeedbackResult = {
  message: string
  success: boolean
  error?: string
}

type FeedbackMap = {
  bug: BugFeedback
  feature: FeatureFeedback
  question: QuestionFeedback
  other: OtherFeedback
}

export type DiscordWebhookData = {
  content?: string
  username?: string
  avatar_url?: string
  tts?: boolean
  embeds?: EmbedData[]
  allowed_mentions?: {
    parse?: ('roles' | 'users' | 'everyone')[]
    roles?: string[]
    users?: string[]
    replied_user?: boolean
  }
  components?: Array<{
    type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    style?: 1 | 2 | 3 | 4 | 5 | 6
    label?: string
    emoji?: {
      name: string
      id?: string
      animated?: boolean
    }
    custom_id?: string
    sku_id?: string
    url?: string
    disabled?: boolean
    components?: Array<{
      type: 2 | 3 | 4 | 5 | 6 | 7 | 8
      custom_id: string
      options?: Array<{
        label: string
        value: string
        description?: string
        emoji?: {
          name: string
          id?: string
          animated?: boolean
        }
        default?: boolean
      }>
      channel_types?: number[]
      placeholder?: string
      default_values?: Array<{
        id: string
        type: 'user' | 'role' | 'channel'
      }>
      min_values?: number
      max_values?: number
      disabled?: boolean
      style?: 1 | 2
      label?: string
      min_length?: number
      max_length?: number
      required?: boolean
      value?: string
    }>
  }>[]  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  files?: any[]
  payload_json?: string
  attachments?: Array<{
    id: string
    filename: string
    description?: string
  }>
  flags?: number
  thread_name?: string
  applied_tags?: string[]
  poll?: {
    question: {
      text: string
    }
    answers: Array<{
      text: string
    }>
    expiry?: string
    allow_multiselect: boolean
    layout_type: number
    results?: {
      votes: number
      total_votes: number
    }
  }
}

export type EmbedData = {
  title?: string
  type?: 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link'
  description?: string
  url?: string
  timestamp?: string | number | Date
  color?: number
  footer?: {
    text: string
    icon_url?: string
    proxy_icon_url?: string
  }
  image?: {
    url?: string
    proxy_url?: string
    height?: number
    width?: number
  }
  thumbnail?: {
    url?: string
    proxy_url?: string
    height?: number
    width?: number
  }
  provider?: {
    name?: string
    url?: string
  }
  author?: {
    name?: string
    url?: string
    icon_url?: string
    proxy_icon_url?: string
  }
  fields?: readonly {
    name: string
    value: string
    inline?: boolean
  }[]
  video?: {
    url?: string
    proxy_url?: string
    height?: number
    width?: number
  }
}

export type FeedbackReport = {
  [K in FeedbackType]: {
    type: K
    feedback: FeedbackMap[K]
  }
}[FeedbackType]

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
}

interface DetailedFeedback extends BaseFeedback {
  reproduce?: string[]
  expected?: string
  actual?: string
}

interface BugFeedback extends DetailedFeedback, SystemInfo {}

interface FeatureFeedback extends BaseFeedback {}

interface QuestionFeedback extends BaseFeedback {}

interface OtherFeedback extends DetailedFeedback, SystemInfo {}

export type FeedbackType = 'bug' | 'feature' | 'question' | 'other'

type FeedbackMap = {
  bug: BugFeedback
  feature: FeatureFeedback
  question: QuestionFeedback
  other: OtherFeedback
}

export type FeedbackReport = {
  [K in FeedbackType]: {
    type: K
    feedback: FeedbackMap[K]
  }
}[FeedbackType]

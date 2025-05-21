export type Supporter = {
  supporterId: number
  name: string
  message?: string
  num_coffees: number
  timestamp: number
}


export type SupporterData = {
  monthly: Member[]
  onetime: Supporter[]
}

export type Member = {
  supporterId: number
  name: string
  message?: string
  num_coffees: number
  timestamp: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

export type SupporterFetchOptions = {
  force: boolean
  page: number
}

export type SupporterAPIData = {
  support_id: number
  support_note: string | null
  support_coffees: number
  transaction_id: string
  support_visibility: number
  support_created_on: string
  support_updated_on: string
  transfer_id: string | null
  supporter_name: string | null
  support_coffee_price: string
  support_email: string
  is_refunded: boolean | null
  support_currency: string
  support_note_pinned: number
  referer: string | null
  country: string | null
  payer_email: string
  payment_platform: string
  payer_name: string
}

export type SupporterAPIResponse = {
  current_page: number
  data: SupporterAPIData[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

export type MemberAPIData = {
  subscription_id: number
  subscription_cancelled_on: string | null
  subscription_created_on: string
  subscription_updated_on: string
  subscription_current_period_start: string
  subscription_current_period_end: string
  subscription_coffee_price: string
  subscription_coffee_num: number
  subscription_is_cancelled: boolean | null
  subscription_is_cancelled_at_period_end: boolean | null
  subscription_currency: string
  subscription_message: string | null
  message_visibility: number
  subscription_duration_type: string
  referer: string | null
  country: string | null
  transaction_id: string
  payer_email: string
  payer_name: string
}

export type MemberAPIResponse = {
  current_page: number
  data: MemberAPIData[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}
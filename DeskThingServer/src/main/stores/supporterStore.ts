import { CacheableStore } from '@shared/types'
import logger from '@server/utils/logger'
import {
  Supporter,
  SupporterAPIResponse,
  SupporterData,
  MemberAPIResponse,
  SupporterFetchOptions,
  PaginatedResponse
} from '@shared/types/supporter'
import { SupporterStoreClass } from '@shared/stores/supporterStore'

type SupporterCachePage = {
  timestamp: number
  data: PaginatedResponse<SupporterData>
}

type SupporterCache = Record<number, SupporterCachePage>

export class SupporterStore implements SupporterStoreClass, CacheableStore {
  private cache: SupporterCache | null = null
  private readonly CACHE_DURATION = 1 * 60 * 60 * 1000 // 1 hour
  private readonly API_URL = 'https://developers.buymeacoffee.com/api/v1/supporters'
  private readonly MEMBERS_API_URL = 'https://developers.buymeacoffee.com/api/v1/subscriptions'
  private readonly TOKEN = process.env.BUYMEACOFFEE_TOKEN

  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
  }

  saveToFile = async (): Promise<void> => {
    // do nothing
  }

  private async fetchOneTimeSupporters(opts: SupporterFetchOptions): Promise<SupporterAPIResponse> {
    try {
      if (!this.TOKEN) {
        throw new Error('Buy Me A Coffee token not configured')
      }

      const response = await fetch(`${this.API_URL}?page=${opts.page}`, {
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch supporters: ${response.status} - ${response.statusText}`)
      }

      const data = (await response.json()) as SupporterAPIResponse
      return data
    } catch (error) {
      logger.error('Error fetching supporters:', {
        function: 'fetchOneTimeSupporters',
        source: 'supporterStore',
        error: error as Error
      })
      throw error
    }
  }

  private async fetchMembers(opts: SupporterFetchOptions): Promise<MemberAPIResponse> {
    try {
      if (!this.TOKEN) {
        throw new Error('Buy Me A Coffee token not configured')
      }

      const response = await fetch(`${this.MEMBERS_API_URL}?page=${opts.page}`, {
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        logger.debug(
          `Failed to fetch members. Token Exists: ${!!this.TOKEN}. Api Url Exists: ${this.MEMBERS_API_URL}`
        )
        throw new Error(`Failed to fetch members: ${response.statusText} (${response.status})`)
      }

      const data = (await response.json()) as MemberAPIResponse
      return data
    } catch (error) {
      logger.error('Error fetching members:', {
        function: 'fetchMembers',
        source: 'supporterStore',
        error: error as Error
      })
      throw error
    }
  }

  private checkCache = async (
    opts: SupporterFetchOptions
  ): Promise<PaginatedResponse<SupporterData> | null> => {
    if (!this.cache) return null

    if (
      this.cache[opts.page] &&
      Date.now() - this.cache[opts.page].timestamp < this.CACHE_DURATION
    ) {
      return this.cache[opts.page].data
    }

    return null
  }

  async fetchSupporters(opts: SupporterFetchOptions): Promise<PaginatedResponse<SupporterData>> {
    try {
      logger.debug('Checking cache for supporters')
      const cachedResponse = await this.checkCache(opts)
      if (cachedResponse) return cachedResponse

      logger.debug('Fetching supporters')
      const [oneTimeResponse, membersResponse] = await Promise.all([
        this.fetchOneTimeSupporters(opts).catch(() => undefined),
        this.fetchMembers(opts).catch(() => undefined)
      ])

      const oneTimeSupporter: Supporter[] =
        oneTimeResponse?.data?.map((supporter) => ({
          supporterId: supporter.support_id,
          name: supporter.payer_name,
          message: supporter.support_note || undefined,
          num_coffees: supporter.support_coffees,
          timestamp: new Date(supporter.support_created_on).getTime()
        })) || []

      const monthlySupporter: Supporter[] =
        membersResponse?.data?.map((supporter) => ({
          supporterId: supporter.subscription_id,
          name: supporter.payer_name,
          message: supporter.subscription_message || undefined,
          num_coffees: supporter.subscription_coffee_num,
          timestamp: new Date(supporter.subscription_created_on).getTime()
        })) || []

      const supporterData: SupporterData = {
        onetime: oneTimeSupporter,
        monthly: monthlySupporter
      }

      if (!this.cache) this.cache = {}

      const returnData: PaginatedResponse<SupporterData> = {
        items: [supporterData],
        total: Math.max(oneTimeResponse?.total || 0, membersResponse?.total || 0),
        page: opts.page,
        totalPages: Math.max(oneTimeResponse?.last_page || 0, membersResponse?.last_page || 0),
        hasMore:
          opts.page < Math.max(oneTimeResponse?.last_page || 0, membersResponse?.last_page || 0)
      }

      this.cache[opts.page] = {
        timestamp: Date.now(),
        data: returnData
      }

      return returnData
    } catch (error) {
      logger.error('Error in fetchSupporters:', {
        function: 'fetchSupporters',
        source: 'supporterStore',
        error: error as Error
      })

      return {
        items: [],
        total: 0,
        page: 0,
        totalPages: 0,
        hasMore: false
      }
    }
  }

  async clearCache(): Promise<void> {
    this.cache = null
  }
}

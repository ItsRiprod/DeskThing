import InterappActions from 'middleware/InterappActions';
import { action, makeAutoObservable, ObservableMap, runInAction } from 'mobx';
import {
  ChildItemResponse,
  ChildrenOfItemResponseItem,
} from './ChildItemStore';
import { getNextLimit, shouldFetchMore } from 'helpers/Pagination';
import { tryActionNTimes } from 'helpers/Retry';
import RemoteConfigStore from './RemoteConfigStore';
import ErrorHandler from 'eventhandler/ErrorHandler';

export interface GetPodcastResponseItem extends ChildrenOfItemResponseItem {
  isTrailer?: boolean;
}

interface GetPodcastResponse extends ChildItemResponse {
  latest_played_uri?: string;
  consumption_order?: ConsumptionOrder;
  trailer?: ChildrenOfItemResponseItem;
}

export enum ConsumptionOrder {
  RECENT = 'RECENT',
  EPISODIC = 'EPISODIC',
}

const isValid = (response: GetPodcastResponse): boolean =>
  response?.items && Array.isArray(response.items);

export const parseConsumptionOrder = (
  consumptionOrder?: string,
): ConsumptionOrder | undefined => {
  if (!consumptionOrder) {
    return undefined;
  }
  switch (consumptionOrder.toUpperCase()) {
    case ConsumptionOrder.RECENT:
      return ConsumptionOrder.RECENT;
    case ConsumptionOrder.EPISODIC:
      return ConsumptionOrder.EPISODIC;
    default:
      return undefined;
  }
};

const mapTrailer = action((trailer: GetPodcastResponseItem) =>
  Object.assign(trailer, { isTrailer: true }),
);

class PodcastStore {
  remoteConfigStore: RemoteConfigStore;
  errorHandler: ErrorHandler;
  interappActions: InterappActions;

  constructor(
    interappActions: InterappActions,
    remoteConfigStore: RemoteConfigStore,
    errorHandler: ErrorHandler,
  ) {
    this.remoteConfigStore = remoteConfigStore;
    this.errorHandler = errorHandler;
    this.interappActions = interappActions;

    makeAutoObservable(this, {
      remoteConfigStore: false,
      interappActions: false,
      errorHandler: false,
    });
  }

  podcasts: ObservableMap<string, GetPodcastResponse> = new ObservableMap<
    string,
    GetPodcastResponse
  >();

  loading: ObservableMap<string, boolean> = new ObservableMap<
    string,
    boolean
  >();

  reset() {
    this.podcasts.clear();
    this.loading.clear();
  }

  async loadFromBeginning(
    uri: string,
    minimumEpisodesToLoad: number,
  ): Promise<void> {
    if (this.loading.get(uri)) {
      return;
    }

    const result = await tryActionNTimes({
      asyncAction: () =>
        this.fetchPodcast(
          uri,
          Math.max(
            this.getNumberOfItemsExcludingTrailer(uri),
            minimumEpisodesToLoad,
          ),
        ),
      n: 3,
    });
    runInAction(() => {
      if (result.success || this.podcasts.get(uri) === undefined) {
        this.podcasts.set(uri, result);
      }
    });
  }

  async loadWholeShow(uri: string): Promise<void> {
    return this.loadFromBeginning(uri, 10000);
  }

  private async fetchPodcast(
    parentId: string,
    limit: number,
    offset?: number,
  ): Promise<GetPodcastResponse> {
    let toReturn: GetPodcastResponse = {
      items: [],
      total: 0,
      success: false,
      offset: 0,
      trailer: undefined,
    };

    try {
      this.loading.set(parentId, true);
      const response = await this.interappActions.getPodcast(
        parentId,
        limit,
        offset,
      );

      if (isValid(response)) {
        toReturn = {
          ...response,
          consumption_order: parseConsumptionOrder(response.consumption_order),
          success: true,
        };
      }
    } catch (e: any) {
      this.errorHandler.logUnexpectedError(e, 'Failed to load podcast');
    } finally {
      runInAction(() => {
        this.loading.set(parentId, false);
      });
    }
    return toReturn;
  }

  async loadMore(
    uri: string,
    pageSize: number,
    currentIndex: number,
    minDistanceFromEnd,
  ): Promise<void> {
    if (
      !shouldFetchMore(
        minDistanceFromEnd,
        this.getNumberOfItemsExcludingTrailer(uri),
        currentIndex,
        this.getTotalNumberOfItems(uri),
      ) ||
      this.loading.get(uri) ||
      this.isError(uri)
    ) {
      return;
    }

    const response = await this.fetchPodcast(
      uri,
      getNextLimit(
        pageSize,
        this.getNumberOfItemsExcludingTrailer(uri),
        this.getTotalNumberOfItems(uri),
      ),
      this.getNumberOfItemsExcludingTrailer(uri),
    );

    runInAction(() => {
      if (response.success && isValid(response)) {
        const podcast = this.podcasts.get(uri);
        if (podcast) {
          podcast.items.push(...response.items);
        }
      }
    });
  }

  getNumberOfItemsExcludingTrailer(uri: string): number {
    return this.podcasts.get(uri)?.items?.length ?? 0;
  }

  getTotalNumberOfItems(uri: string): number {
    return this.podcasts.get(uri)?.total ?? 0;
  }

  isNotRecentConsumptionOrder(uri: string): boolean {
    return (
      this.podcasts.get(uri)?.consumption_order !== ConsumptionOrder.RECENT
    );
  }

  isLoading(uri: string): boolean {
    return this.loading.get(uri) === true;
  }

  getLatestPlayedUri(uri: string): string | undefined {
    return this.podcasts.get(uri)?.latest_played_uri;
  }

  hasLatestPlayedUri(uri: string): boolean {
    return !!this.podcasts.get(uri)?.latest_played_uri;
  }

  shouldShowLatestPlayedEpisode(uri: string): boolean {
    return (
      this.isNotRecentConsumptionOrder(uri) && this.hasLatestPlayedUri(uri)
    );
  }

  getPodcastItemsIncludingTrailer(uri): GetPodcastResponseItem[] {
    const podcast = this.podcasts.get(uri);
    if (!podcast) {
      return [];
    }

    const { trailer, items } = podcast;

    return this.remoteConfigStore.podcastTrailerEnabled && trailer
      ? [mapTrailer(trailer), ...items]
      : items;
  }

  isError(uri): boolean {
    return this.podcasts.get(uri)?.success === false;
  }
}

export default PodcastStore;

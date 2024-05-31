import { RootStore } from './RootStore';
import InterappActions from 'middleware/InterappActions';
import { makeAutoObservable, ObservableMap, runInAction } from 'mobx';
import { getNextLimit, shouldFetchMore } from 'helpers/Pagination';
import { tryActionNTimes } from 'helpers/Retry';
import { HomeChildItem } from './HomeItemsStore';
import { MoreParams } from './ShelfStore';

const FETCH_CATEGORY_ATTEMPTS = 3;

export interface ChildrenOfItemResponseItem {
  available_offline: boolean;
  content_description: string;
  has_children: boolean;
  id: string;
  image_id: string;
  playable: boolean;
  subtitle: string;
  title: string;
  uri: string;
  uid?: string;
  metadata?: {
    is_explicit_content: boolean;
    duration_ms: number;
    is_played?: boolean;
    time_left_ms?: number;
  };
}

export interface ChildItemResponse {
  items: Array<ChildrenOfItemResponseItem>;
  offset?: number;
  total: number;
  success: boolean;
}

export const isChildrenOfItemType = (
  itemToBeDetermined: HomeChildItem | ChildrenOfItemResponseItem,
): itemToBeDetermined is ChildrenOfItemResponseItem => {
  return !!(
    (itemToBeDetermined as ChildrenOfItemResponseItem).id &&
    (itemToBeDetermined as ChildrenOfItemResponseItem).uri
  );
};

const isValid = (response: ChildItemResponse): boolean =>
  response?.items && Array.isArray(response.items);

class ChildItemStore {
  rootStore: RootStore;
  interappActions: InterappActions;

  parents: ObservableMap<string, ChildItemResponse> = new ObservableMap<
    string,
    ChildItemResponse
  >();
  loading: ObservableMap<string, boolean> = new ObservableMap<
    string,
    boolean
  >();

  constructor(rootStore: RootStore, interappActions: InterappActions) {
    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
    });

    this.rootStore = rootStore;
    this.interappActions = interappActions;
  }

  async loadChildData(
    parentId: string,
    minimumEpisodesToLoad: number,
  ): Promise<void> {
    if (this.loading.get(parentId)) {
      return;
    }

    const result = await tryActionNTimes({
      asyncAction: () =>
        this.fetchChildrenOfItem(
          parentId,
          Math.max(this.getNumberOfItems(parentId), minimumEpisodesToLoad),
          0,
        ),
      n: FETCH_CATEGORY_ATTEMPTS,
    });
    runInAction(() => {
      if (result.success || this.parents.get(parentId) === undefined) {
        this.parents.set(parentId, result);
      }
    });
  }

  async loadMore(
    moreParams: MoreParams,
  ): Promise<ChildrenOfItemResponseItem[] | undefined> {
    const {
      parentId,
      pageSize,
      currentIndex,
      numberOfItemsLoaded,
      totalNumberOfItemsAvailable,
      minDistanceFromEnd,
    } = moreParams;
    if (
      !shouldFetchMore(
        minDistanceFromEnd,
        numberOfItemsLoaded,
        currentIndex,
        totalNumberOfItemsAvailable,
      ) ||
      this.loading.get(parentId) ||
      this.isError(parentId)
    ) {
      return undefined;
    }

    let toReturn: ChildrenOfItemResponseItem[] | undefined = undefined;
    try {
      const response = await this.fetchChildrenOfItem(
        parentId,
        getNextLimit(
          pageSize,
          numberOfItemsLoaded,
          totalNumberOfItemsAvailable,
        ),
        numberOfItemsLoaded,
      );

      runInAction(() => {
        if (response.success && isValid(response)) {
          const parent = this.parents.get(parentId);
          if (parent) {
            parent.items.push(...response.items);
            toReturn = response.items;
            parent.success = true;
          }
        }
      });
    } catch (e: any) {
      this.rootStore.errorHandler.logUnexpectedError(
        e,
        `loadMore from getChildrenOfItem failed for ${parentId}`,
      );
    }
    return toReturn;
  }

  prepareForPagination(parentId, startOffset, totalAvailable) {
    this.parents.set(parentId, {
      items: [],
      total: totalAvailable,
      offset: startOffset,
      success: true,
    });
  }

  private async fetchChildrenOfItem(
    parentId: string,
    limit: number,
    offset: number,
  ): Promise<ChildItemResponse> {
    let toReturn: ChildItemResponse = { items: [], total: 0, success: false };

    try {
      this.setLoading(parentId, true);

      const result = await this.interappActions.getChildrenOfItem(
        parentId,
        limit,
        offset,
      );

      if (isValid(result)) {
        toReturn = {
          items: result?.items,
          total: result.total,
          offset: result?.offset,
          success: true,
        };
      }
    } catch (e: any) {
      this.rootStore.errorHandler.logUnexpectedError(
        e,
        'Failed to get children of item',
      );
    } finally {
      this.setLoading(parentId, false);
    }
    return toReturn;
  }

  setLoading(parentId: string, loading: boolean): void {
    this.loading.set(parentId, loading);
  }

  reset() {
    this.parents.clear();
  }

  getTotal(parentId: string): number {
    return this.parents.get(parentId)?.total ?? 0;
  }

  getNumberOfItems(parentId: string): number {
    return this.parents.get(parentId)?.items.length ?? 0;
  }

  getOffset(parentId: string): number {
    return this.parents.get(parentId)?.offset ?? 0;
  }

  getLoadedChildren(parentId: string): ChildrenOfItemResponseItem[] {
    return this.parents.get(parentId)?.items ?? [];
  }

  isError(parentId: string) {
    return this.parents.get(parentId)?.success === false;
  }

  isLoading(parentId: string): boolean {
    return this.loading.get(parentId) === true;
  }

  getChild(parentId: string): ChildItemResponse | undefined {
    return this.parents.get(parentId);
  }

  async getChildItems(
    parentId: string,
    numberOfItemsToLoad,
  ): Promise<ChildItemResponse | undefined> {
    await this.loadChildData(parentId, numberOfItemsToLoad);
    return this.getChild(parentId);
  }
}

export default ChildItemStore;

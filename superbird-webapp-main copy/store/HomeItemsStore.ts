import { RootStore } from './RootStore';
import InterappActions from 'middleware/InterappActions';
import { makeAutoObservable, runInAction } from 'mobx';
import {
  FIRST_PAGE_SIZE,
  MoreParams,
  ShelfCategoryItem,
} from './ShelfStore';
import { tryActionNTimes } from 'helpers/Retry';
import { getNextLimit, shouldFetchMore } from 'helpers/Pagination';

export const FETCH_HOME_ATTEMPTS = 3;

export type HomeOverridesRequest = {
  [key: string]: number;
};

export type HomeGraphOverridesReq = {
  id: string;
  limit: number;
};

export type HomeEndpointItem = {
  title: string;
  uri: string;
  children: HomeChildItem[];
  total: number;
};

export type HomeItem = HomeEndpointItem | HomeGraphItem;

export type HomeGraphItem = {
  title: string;
  id: string;
  children: HomeChildItem[];
  total: number;
};

export type HomeChildItem = {
  image_id: string;
  subtitle: string;
  title: string;
  uri: string;
};

export type HomeResponsePayload = {
  items: HomeItem[];
};

export type GraphHomeResponsePayload = {
  shelf: HomeResponsePayload;
};

export type GraphHomeMoreResponsePayload = {
  section: HomeGraphItem;
};

type GetHomeResponse = {
  result: HomeItem[];
  success: boolean;
};

export const isHomeEndpointItemType = (
  itemToBeDetermined: ShelfCategoryItem,
): itemToBeDetermined is HomeEndpointItem => {
  return !!(
    (itemToBeDetermined as HomeEndpointItem).uri &&
    (itemToBeDetermined as HomeEndpointItem).children
  );
};

export const isGraphHomeItemType = (
  itemToBeDetermined: HomeItem,
): itemToBeDetermined is HomeGraphItem => {
  return !!(itemToBeDetermined as HomeGraphItem).id;
};

class HomeItemsStore {
  rootStore: RootStore;
  interappActions: InterappActions;
  loading = false;
  items: Array<HomeItem> = [];

  constructor(rootStore: RootStore, interappActions: InterappActions) {
    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
      loading: false,
    });

    this.rootStore = rootStore;
    this.interappActions = interappActions;
  }

  async loadHomeItems(): Promise<void> {
    if (this.loading) {
      return;
    }

    const { result, success } = await tryActionNTimes({
      asyncAction: () => {
        return this.rootStore.remoteConfigStore.graphQLShelfEnabled
          ? this.queryHomeItems(
              this.rootStore.shelfStore.getLimitOverridesGraph(),
            )
          : this.fetchHomeItems(this.rootStore.shelfStore.getLimitOverrides());
      },
      n: FETCH_HOME_ATTEMPTS,
    });

    runInAction(() => {
      if (success) {
        this.items = result;
      }
    });
  }

  async fetchHomeItems(
    limitOverrides: HomeOverridesRequest,
  ): Promise<GetHomeResponse> {
    let toReturn: GetHomeResponse = { result: [], success: false };
    try {
      this.loading = true;
      const response = await this.interappActions.getHome(
        FIRST_PAGE_SIZE,
        limitOverrides,
      );
      if (response.items) {
        toReturn = { result: response.items, success: true };
      }
    } catch (e: any) {
      this.rootStore.errorHandler.logUnexpectedError(e, 'fetch home failed');
    } finally {
      this.loading = false;
    }
    return toReturn;
  }

  async queryHomeItems(
    limitOverrides: HomeGraphOverridesReq[],
  ): Promise<GetHomeResponse> {
    let toReturn: GetHomeResponse = { result: [], success: false };
    try {
      this.loading = true;
      const response = await this.interappActions.queryHome(
        FIRST_PAGE_SIZE,
        limitOverrides,
      );
      if (response.shelf.items) {
        toReturn = { result: response.shelf.items, success: true };
      }
    } catch (e: any) {
      this.rootStore.errorHandler.logUnexpectedError(e, 'query home failed');
    } finally {
      this.loading = false;
    }
    return toReturn;
  }

  async queryMore(
    moreParams: MoreParams,
  ): Promise<HomeChildItem[] | undefined> {
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
      )
    ) {
      return undefined;
    }

    let toReturn: HomeChildItem[] | undefined = undefined;

    try {
      const response = await this.interappActions.queryHomeMore(
        parentId,
        getNextLimit(
          pageSize,
          numberOfItemsLoaded,
          totalNumberOfItemsAvailable,
        ),
        numberOfItemsLoaded,
      );

      runInAction(() => {
        if (response.section) {
          const categorySection = this.items.find((category) =>
            isHomeEndpointItemType(category)
              ? category.uri === response.section.id
              : category.id === response.section.id,
          );
          if (categorySection) {
            categorySection.children.push(...response.section.children);
            toReturn = response.section.children;
          }
        }
      });
    } catch (e: any) {
      this.rootStore.errorHandler.logUnexpectedError(
        e,
        `query more home failed for ${parentId}`,
      );
    }
    return toReturn;
  }

  get homeItems(): HomeItem[] {
    return this.items;
  }

  reset() {
    this.items = [];
  }
}

export default HomeItemsStore;

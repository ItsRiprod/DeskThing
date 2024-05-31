import InterappActions from 'middleware/InterappActions';
import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { parseCategoryId } from 'helpers/contentIdExtractor';
import {
  ChildrenOfItemResponseItem,
  isChildrenOfItemType,
} from './ChildItemStore';
import {
  HomeChildItem,
  HomeItem,
  HomeOverridesRequest,
  HomeGraphItem,
  HomeEndpointItem,
  isHomeEndpointItemType,
  HomeGraphOverridesReq,
} from './HomeItemsStore';
import ShelfController from 'component/Shelf/ShelfController';
import { VoiceItem } from 'types/messages';

export enum ItemType {
  MORE = 'More',
  PLAYABLE_ITEM = 'Playable_item',
  UNPLAYABLE_ITEM = 'Unplayable_item',
  SPACER = 'Spacer',
}

export const YOUR_LIBRARY = 'your-library';
export const HOME_IDENTIFIER = 'featured';
export const VOICE_IDENTIFIER = 'voice';
export const MAIN_CATEGORY_IDS = [HOME_IDENTIFIER, VOICE_IDENTIFIER];

export const INITIAL_VISIBLE_ITEMS = 5;
export const INITIAL_VISIBLE_ITEMS_ON_VOICE = 9;
export const NUMBER_OF_ITEMS_TO_SHOW_ON_MORE = 9;
export const FIRST_PAGE_SIZE =
  INITIAL_VISIBLE_ITEMS + NUMBER_OF_ITEMS_TO_SHOW_ON_MORE;

export const TIME_BEFORE_COLLAPSING_CATEGORY = 5_000;

export type ShelfItem = Omit<
  ChildrenOfItemResponseItem,
  'available_offline' | 'content_description' | 'has_children' | 'id'
> & {
  identifier?: string;
  uri?: string;
  category: string;
  type: ItemType;
  target?: { uri: string };
};

export type MoreParams = {
  parentId: string;
  pageSize: number;
  currentIndex: number;
  numberOfItemsLoaded: number;
  totalNumberOfItemsAvailable: number;
  minDistanceFromEnd: number;
};

export type ShelfCategoryItem = HomeGraphItem | HomeEndpointItem;

export type Category = {
  items: ShelfItem[];
  title: string;
  itemsVisible: number;
  parsedId: string;
  id: string;
  total: number;
};

type VoiceResponse = {
  items: VoiceItem[];
  id: string;
};

export const getCategoryItems = (
  category: Category,
  handleVoice = false,
): ShelfItem[] => {
  const firstItem = category.items.length
    ? category.items[0]
    : {
        category: parseCategoryId(category.id),
        playable: false,
        uri: `spotify:playlist:0000000000000000000000`,
        title: '',
        subtitle: '',
        image_id: '',
        type: ItemType.UNPLAYABLE_ITEM,
        identifier: `empty-${parseCategoryId(category.id)}`,
      };
  const secondItem = category.items.length > 1 ? category.items[1] : undefined;

  if (
    category.parsedId !== VOICE_IDENTIFIER &&
    firstItem.type === ItemType.UNPLAYABLE_ITEM
  ) {
    return [
      firstItem,
      {
        ...firstItem,
        type: ItemType.SPACER,
        identifier: `${firstItem.identifier}-spacer`,
      },
    ];
  }

  if (category.parsedId === VOICE_IDENTIFIER) {
    if (
      handleVoice &&
      firstItem.type === ItemType.UNPLAYABLE_ITEM &&
      secondItem?.type !== ItemType.PLAYABLE_ITEM
    ) {
      return [
        firstItem,
        {
          ...firstItem,
          type: ItemType.SPACER,
          identifier: `${firstItem.identifier}-spacer`,
        },
        {
          ...firstItem,
          type: ItemType.SPACER,
          identifier: `spacer-2`,
        },
      ];
    }
    if (!handleVoice && category.items.length === 0) {
      return [
        {
          ...firstItem,
          title: 'No voice results',
          image_id:
            'https://misc.spotifycdn.com/superbird/images/voice_icon.png',
        },
      ];
    }
  }
  return category.items.slice(0, category.itemsVisible);
};

const getVoiceShelfItemType = (voiceItem: VoiceItem, id: string): ShelfItem => {
  return {
    identifier: `voice-item-${voiceItem.target.uri}`,
    playable: true,
    uri: voiceItem.target.uri,
    title: voiceItem.text?.title || '',
    subtitle: voiceItem.text?.subtitle || '',
    image_id: voiceItem.images?.main?.uri ?? '',
    type: ItemType.PLAYABLE_ITEM,
    category: id,
  };
};

const isPlaceHolderUri = (uri: string): boolean =>
  uri.includes('0000000000000000000000');

const getShelfItem = (
  item: ChildrenOfItemResponseItem | HomeChildItem,
  itemCategory: string,
): ShelfItem => {
  let playable = !isPlaceHolderUri(item.uri);
  let id = item.uri;
  if (isChildrenOfItemType(item)) {
    playable = item.playable && !isPlaceHolderUri(item.uri);
    id = item.id;
  }

  return {
    ...item,
    playable: playable,
    type: playable ? ItemType.PLAYABLE_ITEM : ItemType.UNPLAYABLE_ITEM,
    category: parseCategoryId(itemCategory),
    identifier: id + itemCategory,
    title: item.title ?? '',
    subtitle: item.subtitle ?? '',
  };
};

const getMoreItem = (category: Category): ShelfItem[] => {
  if (category.items.length > category.itemsVisible) {
    return [
      {
        identifier: `more-items-${category.title}`,
        category: category.parsedId,
        type: ItemType.MORE,
        title: ItemType.MORE,
        subtitle: '',
        image_id: '',
        playable: false,
        uri: '',
      },
    ];
  }
  return [];
};

class ShelfStore {
  rootStore: RootStore;
  interappActions: InterappActions;
  shelfController: ShelfController;
  loading = false;

  constructor(rootStore: RootStore, interappActions: InterappActions) {
    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
      shelfController: false,
      loading: false,
    });

    this.rootStore = rootStore;
    this.interappActions = interappActions;

    this.shelfController = new ShelfController(
      this,
      this.rootStore.playerStore,
      this.rootStore.viewStore,
      this.rootStore.tracklistStore,
      this.rootStore.voiceStore,
      this.rootStore.hardwareStore,
      this.rootStore.remoteConfigStore,
      this.rootStore.npvStore,
      this.rootStore.ubiLogger.contentShelfUbiLogger,
    );
  }

  initialVisibleItem = INITIAL_VISIBLE_ITEMS;
  categories: Category[] = [];
  voiceCategoryId: string | undefined;

  reset(): void {
    this.initialVisibleItem = INITIAL_VISIBLE_ITEMS;
    this.categories = [];
    this.voiceCategoryId = undefined;
    this.shelfController.reset();
  }

  /**
   * Shelf data
   */
  async getShelfData(): Promise<void> {
    if (!this.rootStore.sessionStateStore.isLoggedIn) {
      return;
    }

    try {
      this.loading = true;
      await this.rootStore.homeItemsStore.loadHomeItems();
      this.loading = false;
      this.populateShelfData();
    } catch (e: any) {
      this.loading = false;
      this.rootStore.errorHandler.logUnexpectedError(
        e,
        'Failed to load shelf data',
      );
    }
  }

  async maybeLoadMore(categoryId: string) {
    if (categoryId === this.voiceCategoryId || this.loading) {
      return;
    }

    const category = this.shelfCategories.find(
      (c) => c.parsedId === categoryId,
    );

    if (category) {
      const moreParams = {
        parentId: category.id,
        pageSize: NUMBER_OF_ITEMS_TO_SHOW_ON_MORE,
        currentIndex: category.itemsVisible - 1,
        numberOfItemsLoaded: category.items.length,
        totalNumberOfItemsAvailable: category.total,
        minDistanceFromEnd: NUMBER_OF_ITEMS_TO_SHOW_ON_MORE,
      };
      let items;
      let total = category.total;
      if (this.shouldUseGraphQl) {
        items = await this.rootStore.homeItemsStore.queryMore(moreParams);
      } else {
        items = await this.rootStore.childItemStore.loadMore(moreParams);
        total = this.rootStore.childItemStore.getTotal(category.id);
      }

      if (items) {
        runInAction(() => {
          items.map((item: ChildrenOfItemResponseItem | HomeChildItem) =>
            getShelfItem(item, category.id),
          );
          category.items = [
            ...category.items,
            ...items.map((i) => getShelfItem(i, category.parsedId)),
          ];
          category.total = total;
        });
      }
    }
  }

  getLimitOverrides(): HomeOverridesRequest {
    return this.shelfCategories
      .filter((category) => category.parsedId !== this.voiceCategoryId)
      .reduce((overrides, category) => {
        if (category.items.length > FIRST_PAGE_SIZE) {
          overrides[category.parsedId] = category.items.length;
        }
        return overrides;
      }, {});
  }

  getLimitOverridesGraph(): HomeGraphOverridesReq[] {
    return this.shelfCategories
      .filter(
        (category) =>
          category.parsedId !== this.voiceCategoryId &&
          category.items.length > FIRST_PAGE_SIZE,
      )
      .map((category) => ({
        id: category.parsedId,
        limit: category.items.length,
      }));
  }

  private getVoiceCategory(parsedId: string): Category | undefined {
    const currentVoiceCategory = this.shelfCategories.find(
      (oldCategory: Category) =>
        oldCategory.parsedId === this.voiceCategoryId &&
        oldCategory.items.length > 0,
    );
    if (parsedId === this.voiceCategoryId && currentVoiceCategory) {
      return currentVoiceCategory;
    }
    return undefined;
  }

  private getShelfDataFromCategoryItems(category: ShelfCategoryItem): Category {
    const id = isHomeEndpointItemType(category) ? category.uri : category.id;

    const parsedId = parseCategoryId(id);
    const currentVoiceCategory = this.getVoiceCategory(parsedId);
    if (currentVoiceCategory !== undefined) {
      return currentVoiceCategory;
    }
    const children = category.children.map((item: HomeChildItem) =>
      getShelfItem(item, id),
    );
    const total = category.total;
    return this.formatShelfData(category, children, total);
  }

  private populateShelfData() {
    const categoriesFromDataStores = this.parseCategoriesFromDataStores();

    this.shelfController.populateShelfState(categoriesFromDataStores);
  }

  private parseCategoriesFromDataStores(): Category[] {
    const categoriesFromDataStores =
      this.rootStore.homeItemsStore.homeItems.map((category) =>
        this.getShelfDataFromCategoryItems(category),
      );

    categoriesFromDataStores
      .filter((category) => category.parsedId !== this.voiceCategoryId)
      .forEach((category) =>
        this.rootStore.childItemStore.prepareForPagination(
          category.id,
          category.items.length,
          category.total,
        ),
      );
    return categoriesFromDataStores;
  }

  /**
   * Parse data in to shelf structure
   */
  private formatShelfData(
    category: HomeItem,
    childData: ShelfItem[],
    total: number,
  ) {
    const id = isHomeEndpointItemType(category) ? category.uri : category.id;
    const parsedId = parseCategoryId(id);
    const currentCategory = this.shelfCategories.find((c) => c.id === id);

    const itemsVisible = this.getVisibleItems(
      parsedId,
      childData,
      currentCategory,
    );

    return {
      title: category.title,
      parsedId,
      id: id,
      itemsVisible: itemsVisible,
      items: childData,
      total,
    };
  }

  private getVisibleItems(
    parsedId: string,
    childData: ShelfItem[],
    category?: Category,
  ) {
    if (parsedId === HOME_IDENTIFIER) {
      // Show all items on the featured shelf without 'more' button.
      return childData.length;
    }
    return category?.itemsVisible || INITIAL_VISIBLE_ITEMS;
  }

  get shouldShowVoiceDefault() {
    return this.rootStore.remoteConfigStore.pushToTalkShelfEnabled;
  }

  get shouldUseGraphQl() {
    return this.rootStore.remoteConfigStore.graphQLShelfEnabled;
  }

  populateVoice({ items, id }: VoiceResponse): void {
    if (items && Array.isArray(items)) {
      const voiceItems = items.map((item: VoiceItem) =>
        getVoiceShelfItemType(item, id),
      );

      const voiceCategory = this.shelfCategories.find(
        (category) => category.parsedId === id,
      );

      if (voiceCategory && voiceItems.length) {
        voiceCategory.items = this.shouldShowVoiceDefault
          ? [
              getCategoryItems(voiceCategory, this.shouldShowVoiceDefault)[0],
              ...voiceItems,
            ]
          : voiceItems;
        voiceCategory.total = voiceItems.length;
        this.voiceCategoryId = id;
        voiceCategory.itemsVisible = INITIAL_VISIBLE_ITEMS_ON_VOICE;
        this.shelfController.updateSelectedItem(voiceCategory.items[0]);
      }
    }
  }

  /**
   * Shelf state
   */
  get shelfItems(): ShelfItem[] {
    return this.shelfCategories.reduce(
      (shelfItems: ShelfItem[], category: Category) => {
        const categoryItems = [
          ...getCategoryItems(category, this.shouldShowVoiceDefault),
          ...getMoreItem(category),
        ];

        return [...shelfItems, ...categoryItems];
      },
      [],
    );
  }

  getItemsByCategory(inputCategory: string) {
    const byCategory = this.shelfCategories.find(
      (category) => category.parsedId === inputCategory,
    );
    return byCategory ? byCategory.items : [];
  }

  get shelfCategories(): Category[] {
    return this.categories;
  }

  setShelfCategories(categoriesFromDataStores: Category[]): void {
    this.categories = categoriesFromDataStores;
  }
}

export default ShelfStore;

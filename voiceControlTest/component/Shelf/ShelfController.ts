import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { transitionDurationMs } from 'style/Variables';
import { isTrackOrEpisode } from 'helpers/SpotifyUriUtil';
import { isShowURI } from '@spotify-internal/uri';
import {
  getShelfFeatureIdentifierForTrackOrEpisode,
  setTrackViewVoiceFeatureIdentifier,
} from 'helpers/FeatureIdentifiers';
import { getShelfItemTitle } from 'helpers/ContextTitleExtractor';
import ShelfStore, {
  Category,
  FIRST_PAGE_SIZE,
  HOME_IDENTIFIER,
  INITIAL_VISIBLE_ITEMS,
  ItemType,
  MAIN_CATEGORY_IDS,
  NUMBER_OF_ITEMS_TO_SHOW_ON_MORE,
  ShelfItem,
  TIME_BEFORE_COLLAPSING_CATEGORY,
  VOICE_IDENTIFIER,
} from 'store/ShelfStore';
import PlayerStore from 'store/PlayerStore';
import ViewStore from 'store/ViewStore';
import { isSupportedUriType } from 'component/Tracklist/TracklistUiState';
import VoiceStore from 'store/VoiceStore';
import ShelfSwiperUiState from 'component/Shelf/ShelfSwiper/ShelfSwiperUiState';
import ShelfHeaderUiState from 'component/Shelf/ShelfHeader/ShelfHeaderUiState';
import ShelfSwiperItemUiState from 'component/Shelf/ShelfItem/ShelfSwiperItemUiState';
import ContentShelfUbiLogger from 'eventhandler/ContentShelfUbiLogger';
import HardwareStore from 'store/HardwareStore';
import TracklistStore from 'store/TracklistStore';
import RemoteConfigStore from 'store/RemoteConfigStore';
import NpvStore from 'store/NpvStore';
import createVoiceMuteBannerUiState, {
  VoiceMuteBannerUiState,
} from 'component/Shelf/VoiceMutedbanner/VoiceMuteBannerUiState';

class ShelfController {
  shelfStore: ShelfStore;
  playerStore: PlayerStore;
  viewStore: ViewStore;
  tracklistStore: TracklistStore;
  voiceStore: VoiceStore;
  hardwareStore: HardwareStore;
  remoteConfigStore: RemoteConfigStore;
  npvStore: NpvStore;
  swiperUiState: ShelfSwiperUiState;
  headerUiState: ShelfHeaderUiState;
  shelfSwiperItemUiState: ShelfSwiperItemUiState;
  contentShelfUbiLogger: ContentShelfUbiLogger;
  voiceMuteBannerUiState: VoiceMuteBannerUiState;

  constructor(
    shelfStore: ShelfStore,
    playerStore: PlayerStore,
    viewStore: ViewStore,
    tracklistStore: TracklistStore,
    voiceStore: VoiceStore,
    hardwareStore: HardwareStore,
    remoteConfigStore: RemoteConfigStore,
    npvStore: NpvStore,
    contentShelfUbiLogger: ContentShelfUbiLogger,
  ) {
    makeAutoObservable(this, {
      shelfStore: false,
      playerStore: false,
      viewStore: false,
      tracklistStore: false,
      voiceStore: false,
      hardwareStore: false,
      remoteConfigStore: false,
      npvStore: false,
      swiperUiState: false,
      shelfSwiperItemUiState: false,
      headerUiState: false,
      contentShelfUbiLogger: false,
      collapseTimeoutIds: false,
      voiceMuteBannerUiState: false,
    });

    this.shelfStore = shelfStore;
    this.playerStore = playerStore;
    this.viewStore = viewStore;
    this.tracklistStore = tracklistStore;
    this.voiceStore = voiceStore;
    this.hardwareStore = hardwareStore;
    this.npvStore = npvStore;
    this.remoteConfigStore = remoteConfigStore;
    this.contentShelfUbiLogger = contentShelfUbiLogger;

    this.swiperUiState = new ShelfSwiperUiState(
      this,
      this.playerStore,
      this.viewStore,
      this.contentShelfUbiLogger,
    );

    this.headerUiState = new ShelfHeaderUiState(
      this.shelfStore,
      this.playerStore,
      this.viewStore,
      this.contentShelfUbiLogger,
    );

    this.shelfSwiperItemUiState = new ShelfSwiperItemUiState(
      this.shelfStore,
      this.playerStore,
      this.hardwareStore,
      this.voiceStore,
      this.remoteConfigStore,
      this.npvStore,
      this.contentShelfUbiLogger,
    );

    this.voiceMuteBannerUiState = createVoiceMuteBannerUiState(
      this.voiceStore,
      this.contentShelfUbiLogger,
    );

    this.onCategoryChange((newCategoryId, prevCategoryId) =>
      this.handleCategoryChanged(newCategoryId, prevCategoryId),
    );
  }

  collapseTimeoutIds: Record<string, number> = {};
  selectedItem: ShelfItem | undefined;

  /**
   * Shelf state
   */
  get selectedItemCategory(): string {
    if (!this.selectedItem) {
      return '';
    }
    return this.selectedItem.category;
  }

  get selectedItemIndex(): number | undefined {
    if (!this.selectedItem) {
      return undefined;
    }
    return this.getItemIndex(this.selectedItem, this.shelfStore.shelfItems);
  }

  getItemIndex(item: ShelfItem, shelfItems: ShelfItem[]): number {
    return shelfItems.findIndex(
      (shelfItem) =>
        item.identifier === shelfItem.identifier &&
        item.category === shelfItem.category,
    );
  }

  getIndexOfItemInCategory(uri: string | undefined, category: string): number {
    const categoryData = this.shelfCategories.find(
      (c) => c.parsedId === category,
    );
    return categoryData
      ? categoryData.items.findIndex((it) => it.uri === uri)
      : -1;
  }

  get isOnFirstItemInHome(): boolean {
    return this.selectedItemIndex === 0;
  }

  get rightItem(): ShelfItem | undefined {
    if (this.selectedItem && this.selectedItemIndex !== undefined) {
      return (
        this.shelfItems
          .slice(this.selectedItemIndex + 1)
          .find((item) => item.type !== ItemType.SPACER) ?? this.selectedItem
      );
    }
    return undefined;
  }

  get leftItem(): ShelfItem | undefined {
    if (!this.selectedItem) {
      return undefined;
    }
    return (
      this.shelfItems
        .slice(0, this.selectedItemIndex)
        .reverse()
        .find((item) => item.type !== ItemType.SPACER) ?? this.selectedItem
    );
  }

  get shelfItems(): ShelfItem[] {
    return this.shelfStore.shelfItems;
  }

  get firstLibraryCategoryId(): string | undefined {
    return this.shelfCategories.find(
      (category) => !MAIN_CATEGORY_IDS.includes(category.parsedId),
    )?.parsedId;
  }

  getShelfInitialVisibleNumber(category?: Category): number {
    if (category?.parsedId === HOME_IDENTIFIER) {
      return category?.items.length;
    }
    return this.shelfStore.initialVisibleItem;
  }

  get shelfCategories(): Array<Category> {
    return this.shelfStore.shelfCategories;
  }

  get currentShelfCategoryVisibleItems(): number | undefined {
    const activeCategory = this.shelfCategories.find(
      (category) => category.parsedId === this.selectedItem?.category,
    );
    return activeCategory && activeCategory.itemsVisible;
  }

  getCategoryFromId(categoryId): Category | undefined {
    return this.shelfCategories.find(
      (category) => category.parsedId === categoryId,
    );
  }

  getAllShelfItemsFromCategories = (
    shelfCategories: Category[],
  ): ShelfItem[] => {
    return shelfCategories.map((category) => category.items).flat();
  };

  getNewSelectedItem(
    oldSelectedItem: ShelfItem | undefined,
    oldShelfItems: ShelfItem[],
    newShelfItems: ShelfItem[],
  ): ShelfItem {
    if (oldSelectedItem?.type === ItemType.MORE) {
      return oldSelectedItem;
    }

    const oldSelectedItemIndex = oldSelectedItem
      ? this.getItemIndex(oldSelectedItem, oldShelfItems)
      : undefined;

    // always return the first item in HOME if it is focused
    if (oldSelectedItemIndex && oldSelectedItemIndex === 0) {
      return newShelfItems[0];
    }
    // if focused item exist in the new data, return it
    if (
      oldSelectedItem &&
      newShelfItems.some(
        (item) => item.identifier === oldSelectedItem?.identifier,
      )
    ) {
      return oldSelectedItem;
    }
    // if in HOME and focused item not exist in the new data, return the first in new list
    if (oldSelectedItem?.category === HOME_IDENTIFIER) {
      return newShelfItems[0];
    }

    const newItemsInCategory = newShelfItems.filter(
      (item) => item.category === oldSelectedItem?.category,
    );

    const oldFirstIndexInCategory = oldShelfItems.findIndex(
      (item) => item.category === oldSelectedItem?.category,
    );
    const oldItemCategoryIndex =
      oldSelectedItemIndex !== undefined
        ? oldSelectedItemIndex - oldFirstIndexInCategory
        : undefined;

    const oldCategoryItems = oldShelfItems.filter(
      (item) => item.category === oldSelectedItem?.category,
    );

    // In NOT HOME category, find the first item to the right that still exists
    const matchingItemToRight = oldCategoryItems
      .slice(oldItemCategoryIndex)
      .find((oldItem) =>
        newItemsInCategory.find(
          (newItem) => newItem.identifier === oldItem.identifier,
        ),
      );

    if (matchingItemToRight) {
      return matchingItemToRight;
    }

    // In NOT HOME category, find the first item to the left that still exists
    const matchingItemToLeft = oldCategoryItems
      .slice(0, oldItemCategoryIndex)
      .reverse()
      .find((oldItem) =>
        newItemsInCategory.find(
          (newItem) => newItem.identifier === oldItem.identifier,
        ),
      );

    if (matchingItemToLeft) {
      return matchingItemToLeft;
    }

    const newFirstIndexInCategory = newShelfItems.findIndex(
      (item) => item.category === oldSelectedItem?.category,
    );
    return newShelfItems[newFirstIndexInCategory];
  }

  /**
   * Actions
   */

  populateShelfState(categoriesFromDataStores: Category[]) {
    const previousVisibleByActiveCategory =
      this.currentShelfCategoryVisibleItems;
    const activeCategory = this.shelfCategories.find(
      (category) => category.parsedId === this.selectedItem?.category,
    );
    const previousInitialVisibleNumber =
      this.getShelfInitialVisibleNumber(activeCategory);
    const allNewShelfItems = this.getAllShelfItemsFromCategories(
      categoriesFromDataStores,
    );

    const newSelectedItem = this.getNewSelectedItem(
      this.selectedItem,
      this.shelfItems,
      allNewShelfItems,
    );
    this.shelfStore.setShelfCategories(categoriesFromDataStores);
    this.updateSelectedItem(newSelectedItem);

    if (
      previousVisibleByActiveCategory &&
      previousVisibleByActiveCategory > previousInitialVisibleNumber
    ) {
      this.openCategory(
        this.selectedItem?.category,
        previousVisibleByActiveCategory,
      );
    }
    if (!this.selectedItem?.category) {
      this.updateSelectedItem(this.shelfItems[0]);
    }
  }

  updateSelectedItem(item: ShelfItem | undefined): void {
    if (item) {
      this.selectedItem = item;
    }
    if (this.selectedItem?.type === ItemType.SPACER) {
      this.goToPreviousContent();
    }
  }

  goBackToHome(): void {
    this.collapseAllCategories();
    this.updateSelectedItem(this.shelfItems[0]);
  }

  handleShelfTitleSelected(categoryId: string | undefined): void {
    if (!categoryId) {
      return;
    }
    this.collapseNotActiveCategories(categoryId);
    this.updateToFirstItemOfCategory(categoryId);
  }

  handlePushToTalkSelected(item: ShelfItem) {
    if (
      item.type === ItemType.UNPLAYABLE_ITEM &&
      item.category === VOICE_IDENTIFIER
    ) {
      this.updateToFirstItemOfCategory(VOICE_IDENTIFIER);
    }
  }

  handleMoreButtonSelected(itemCategory: string): void {
    runInAction(() => {
      this.swiperUiState.animateSliding = false;
    });
    const indexOfMoreButton = this.selectedItemIndex;

    this.expandCategory(itemCategory);
    if (indexOfMoreButton) {
      this.updateSelectedItem(this.shelfItems[indexOfMoreButton]);
    }
    this.collapseNotActiveCategories(itemCategory);

    this.shelfStore.maybeLoadMore(itemCategory);
  }

  handleItemSelected(
    selectedItem: ShelfItem | undefined,
    interactionId?: string,
  ): void {
    if (!selectedItem) {
      return;
    }

    if (selectedItem.type === ItemType.MORE) {
      this.handleMoreButtonSelected(selectedItem.category);
    } else if (
      selectedItem.type === ItemType.PLAYABLE_ITEM &&
      selectedItem.uri
    ) {
      window.setTimeout(
        () => this.updateSelectedItem(selectedItem),
        transitionDurationMs,
      );
      if (isTrackOrEpisode(selectedItem.uri)) {
        this.handleTrackOrEpisodeSelected(selectedItem, interactionId);
      } else {
        this.handleContextItemSelected(selectedItem);
      }
    }
  }

  private handleContextItemSelected(item: ShelfItem): void {
    if (item.category === VOICE_IDENTIFIER) {
      setTrackViewVoiceFeatureIdentifier(
        item,
        this.voiceStore,
        this.shelfStore,
      );
    }
    this.tracklistStore.tracklistUiState.handleSupportedTracklists({
      uri: item.uri,
      title: this.remoteConfigStore.graphQLShelfEnabled
        ? item.title
        : getShelfItemTitle(item.title, item.uri),
      image_id: item.image_id,
    });
    if (
      isSupportedUriType(item.uri) &&
      !this.tracklistStore.tracklistUiState.isStationAndNotCurrentlyPlaying(
        item.uri,
      )
    ) {
      this.viewStore.showTracklist({
        type: 'context_item',
        value: {
          uri: item.uri,
          title: getShelfItemTitle(item.title, item.uri),
          image_id: item.image_id,
        },
      });
    }
  }

  private handleTrackOrEpisodeSelected(
    item: ShelfItem,
    interactionId?: string,
  ) {
    this.playerStore.setIsPodcast(isShowURI(item.uri));

    if (item.uri === this.playerStore.currentTrackUri) {
      this.playerStore.playIfPaused();
    } else {
      const featureIdentifier = getShelfFeatureIdentifierForTrackOrEpisode(
        item,
        this.shelfStore,
        this.voiceStore,
      );
      this.playerStore.playItem(item.uri, featureIdentifier, interactionId);
    }
    this.viewStore.showNpv();
  }

  updateToFirstItemOfCategory(categoryId: string): void {
    const firstItemOfType = this.shelfItems.find(
      (item) => item.category === categoryId,
    );
    if (firstItemOfType) {
      this.updateSelectedItem(firstItemOfType);
    }
  }

  openCategory(
    itemCategory: string | undefined,
    numberOfItemsToShow = FIRST_PAGE_SIZE,
  ): void {
    const categoryToExpand = this.getCategoryFromId(itemCategory);

    if (!categoryToExpand) {
      return;
    }

    categoryToExpand.itemsVisible = Math.min(
      numberOfItemsToShow,
      categoryToExpand.items.length,
    );

    if (itemCategory) {
      this.shelfStore.maybeLoadMore(itemCategory);
    }
  }

  expandCategory(itemCategory: string): void {
    const categoryToExpand = this.getCategoryFromId(itemCategory);

    if (!categoryToExpand) {
      return;
    }

    if (
      categoryToExpand.items.length <=
      this.getShelfInitialVisibleNumber(categoryToExpand)
    ) {
      return;
    }

    categoryToExpand.itemsVisible = Math.min(
      categoryToExpand.itemsVisible + NUMBER_OF_ITEMS_TO_SHOW_ON_MORE,
      categoryToExpand.items.length,
    );
  }

  collapseAllCategories(): void {
    this.shelfCategories.forEach((category) => {
      category.itemsVisible = this.getShelfInitialVisibleNumber(category);
    });
  }

  collapseNotActiveCategories(id: string): void {
    const categoriesToCollapse = this.shelfCategories.filter(
      (category) => category.parsedId !== id,
    );
    categoriesToCollapse.forEach((category) => {
      category.itemsVisible = this.getShelfInitialVisibleNumber(category);
    });
  }

  goToNextContent(): void {
    this.updateSelectedItem(this.rightItem);
  }

  goToPreviousContent(): void {
    this.updateSelectedItem(this.leftItem);
  }

  handleCategoryChanged(
    newCategoryId: string | undefined,
    prevCategoryId: string | undefined,
  ) {
    if (newCategoryId && prevCategoryId) {
      const prevCategory = this.getCategoryFromId(prevCategoryId);

      if (!prevCategory) {
        return;
      }

      window.clearTimeout(this.collapseTimeoutIds[newCategoryId]);

      const previousCategoryExpanded =
        prevCategory.itemsVisible > INITIAL_VISIBLE_ITEMS;

      if (previousCategoryExpanded) {
        this.collapseTimeoutIds[prevCategoryId] = window.setTimeout(() => {
          runInAction(() => {
            this.swiperUiState.animateSliding = false;
            prevCategory.itemsVisible =
              this.getShelfInitialVisibleNumber(prevCategory);
          });
        }, TIME_BEFORE_COLLAPSING_CATEGORY);
      }
    }
  }

  handleDialPress() {
    this.voiceMuteBannerUiState.dismissVoiceBanner();
    let interactionId;
    if (
      this.selectedItem &&
      this.selectedItem.type === ItemType.PLAYABLE_ITEM
    ) {
      const { uri, category } = this.selectedItem;
      interactionId = this.contentShelfUbiLogger.logDialButtonPressed(
        category,
        this.getIndexOfItemInCategory(uri, category),
        uri,
      );
    } else if (
      this.selectedItem &&
      this.selectedItem.type === ItemType.MORE &&
      this.selectedItemCategory
    ) {
      interactionId = this.contentShelfUbiLogger.logMoreButtonDialPressed(
        this.selectedItemCategory,
      );
    } else if (
      this.selectedItem &&
      this.selectedItem.type === ItemType.UNPLAYABLE_ITEM &&
      this.selectedItem.category === VOICE_IDENTIFIER &&
      this.shelfSwiperItemUiState.showPushToTalk
    ) {
      this.shelfSwiperItemUiState.pushToTalkDialPressed(
        this.selectedItem.category,
      );
    }
    this.handleItemSelected(this.selectedItem, interactionId);
  }

  handleDialLeft() {
    this.voiceMuteBannerUiState.dismissVoiceBanner();
    this.contentShelfUbiLogger.logDialButtonRotated();
    this.goToPreviousContent();
    this.viewStore.showContentShelf();
  }

  handleDialRight() {
    this.voiceMuteBannerUiState.dismissVoiceBanner();
    this.contentShelfUbiLogger.logDialButtonRotated();
    this.goToNextContent();
    this.viewStore.showContentShelf();
  }

  handleBackButton() {
    this.voiceMuteBannerUiState.dismissVoiceBanner();
    if (!this.isOnFirstItemInHome) {
      this.goBackToHome();
    } else {
      this.contentShelfUbiLogger.logBackButtonPressed();
      this.viewStore.back();
    }
  }

  reset(): void {
    this.selectedItem = undefined;
  }

  /**
   * Reactions
   */
  onCategoryChange(
    callback: (
      newCategoryId: string | undefined,
      prevCategoryId: string | undefined,
    ) => void,
  ) {
    reaction(
      () => this.selectedItemCategory,
      (value, prevValue) => callback(value, prevValue),
    );
  }
}

export default ShelfController;

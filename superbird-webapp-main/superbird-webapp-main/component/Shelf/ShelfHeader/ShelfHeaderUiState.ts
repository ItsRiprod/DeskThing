import { makeAutoObservable } from 'mobx';
import ShelfStore, {
  Category,
  MAIN_CATEGORY_IDS,
  YOUR_LIBRARY,
} from 'store/ShelfStore';
import ContentShelfUbiLogger from 'eventhandler/ContentShelfUbiLogger';
import PlayerStore from 'store/PlayerStore';
import ViewStore from 'store/ViewStore';

export default class ShelfHeaderUiState {
  shelfStore: ShelfStore;
  playerStore: PlayerStore;
  viewStore: ViewStore;
  contentShelfUbiLogger: ContentShelfUbiLogger;

  constructor(
    shelfStore: ShelfStore,
    playerStore: PlayerStore,
    viewStore: ViewStore,
    contentShelfUbiLogger: ContentShelfUbiLogger,
  ) {
    makeAutoObservable(this, {
      shelfStore: false,
      playerStore: false,
      viewStore: false,
      contentShelfUbiLogger: false,
    });

    this.shelfStore = shelfStore;
    this.playerStore = playerStore;
    this.viewStore = viewStore;
    this.contentShelfUbiLogger = contentShelfUbiLogger;
  }

  get shouldShowShelfHeader(): boolean {
    return !!this.shelfStore.shelfCategories.length;
  }

  get isInYourLibrary(): boolean {
    return !MAIN_CATEGORY_IDS.includes(
      this.shelfStore.shelfController.selectedItemCategory,
    );
  }

  get mainCategories(): Array<Category> {
    return this.shelfStore.shelfCategories.filter((category) =>
      MAIN_CATEGORY_IDS.includes(category.parsedId),
    );
  }

  get mainCategoriesCount(): number {
    return this.mainCategories.length;
  }

  get yourLibraryCategories(): Array<Category> {
    return this.shelfStore.shelfCategories.filter(
      (category) => !MAIN_CATEGORY_IDS.includes(category.parsedId),
    );
  }

  get activeTitleIndex(): number {
    const yourLibraryCategoryIds = this.yourLibraryCategories.map(
      (category) => category.parsedId,
    );

    const titleCategories = this.mainCategories
      .map((category) => category.parsedId)
      .concat([YOUR_LIBRARY])
      .concat(yourLibraryCategoryIds);

    return titleCategories.findIndex(
      (categoryId) =>
        this.shelfStore.shelfController.selectedItemCategory === categoryId,
    );
  }

  isSelectedItemCategory(categoryId: string): boolean {
    return this.shelfStore.shelfController.selectedItemCategory === categoryId;
  }

  /**
   * Actions
   */
  headerItemClicked = (id: string): void => {
    const clickCategoryId =
      id === YOUR_LIBRARY
        ? this.shelfStore.shelfController.firstLibraryCategoryId
        : id;
    this.contentShelfUbiLogger.logQuickScrollClicked(clickCategoryId);
    this.viewStore.showContentShelf();
    this.shelfStore.shelfController.handleShelfTitleSelected(clickCategoryId);
  };
}

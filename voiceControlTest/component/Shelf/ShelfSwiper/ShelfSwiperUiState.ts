import ContentShelfUbiLogger from 'eventhandler/ContentShelfUbiLogger';
import { makeAutoObservable } from 'mobx';
import PlayerStore from 'store/PlayerStore';
import { ItemType, ShelfItem, VOICE_IDENTIFIER } from 'store/ShelfStore';
import ViewStore from 'store/ViewStore';
import ShelfController from 'component/Shelf/ShelfController';

export const getAdjustedIndex = (
  draggedToIndex: number,
  allShelfItems: ShelfItem[],
  selectedItemIndex: number,
): number => {
  const isSelectableItem =
    allShelfItems[draggedToIndex]?.type !== ItemType.SPACER;

  const isVoiceSpacer =
    allShelfItems[draggedToIndex]?.type === ItemType.SPACER &&
    allShelfItems[draggedToIndex]?.category === VOICE_IDENTIFIER;

  if (
    isSelectableItem ||
    (draggedToIndex === selectedItemIndex && !isVoiceSpacer)
  ) {
    return draggedToIndex;
  }

  if (draggedToIndex === allShelfItems.length - 1) {
    return draggedToIndex - 1;
  }

  if (isVoiceSpacer) {
    const lastVoiceSpacerIndex =
      allShelfItems[draggedToIndex + 1]?.category !== VOICE_IDENTIFIER;

    if (lastVoiceSpacerIndex) {
      return draggedToIndex + 1;
    }
    return draggedToIndex - 1;
  }

  return draggedToIndex > selectedItemIndex
    ? draggedToIndex + 1
    : draggedToIndex - 1;
};

export default class ShelfSwiperUiState {
  shelfController: ShelfController;
  playerStore: PlayerStore;
  viewStore: ViewStore;
  contentShelfUbiLogger: ContentShelfUbiLogger;
  animateSliding = false;

  constructor(
    shelfController: ShelfController,
    playerStore: PlayerStore,
    viewStore: ViewStore,
    contentShelfUbiLogger: ContentShelfUbiLogger,
  ) {
    makeAutoObservable(this, {
      shelfController: false,
      playerStore: false,
      viewStore: false,
      contentShelfUbiLogger: false,
      animateSliding: false,
    });

    this.shelfController = shelfController;
    this.playerStore = playerStore;
    this.viewStore = viewStore;
    this.contentShelfUbiLogger = contentShelfUbiLogger;
  }

  get selectedItemIndex(): number | undefined {
    return this.shelfController.selectedItemIndex;
  }

  get allShelfItems(): ShelfItem[] {
    return this.shelfController.shelfItems;
  }

  /**
   * Actions
   */
  setAnimateSliding = (animateSliding: boolean): void => {
    this.animateSliding = animateSliding;
  };

  dismissBanner() {
    this.shelfController.voiceMuteBannerUiState.dismissVoiceBanner();
  }

  handleDraggedToIndex(index: number): void {
    this.contentShelfUbiLogger.logShelfScrolledByTouch();
    if (this.selectedItemIndex !== undefined) {
      const userDraggedToItem =
        this.allShelfItems[
          getAdjustedIndex(index, this.allShelfItems, this.selectedItemIndex)
        ];
      if (userDraggedToItem) {
        this.shelfController.updateSelectedItem(userDraggedToItem);
        this.viewStore.showContentShelf();
      }
    }
  }
}

import PlayerStore from 'store/PlayerStore';
import QueueStore, { QueueItem } from 'store/QueueStore';
import ViewStore from 'store/ViewStore';
import InterappActions from 'middleware/InterappActions';
import { get, makeAutoObservable } from 'mobx';
import { titleBasedOnType } from 'helpers/ContextTitleExtractor';
import ImageStore from 'store/ImageStore';
import HardwareStore from 'store/HardwareStore';
import QueueUbiLogger from '../../eventhandler/QueueUbiLogger';

class QueueUiState {
  playerStore: PlayerStore;
  queueStore: QueueStore;
  imageStore: ImageStore;
  viewStore: ViewStore;
  hardwareStore: HardwareStore;
  interappActions: InterappActions;
  queueUbiLogger: QueueUbiLogger;
  animateSliding: boolean = false;

  constructor(
    playerStore: PlayerStore,
    queueStore: QueueStore,
    imageStore: ImageStore,
    viewStore: ViewStore,
    hardwareStore: HardwareStore,
    queueUbiLogger: QueueUbiLogger,
    interappActions: InterappActions,
  ) {
    this.playerStore = playerStore;
    this.queueStore = queueStore;
    this.imageStore = imageStore;
    this.viewStore = viewStore;
    this.hardwareStore = hardwareStore;
    this.interappActions = interappActions;
    this.queueUbiLogger = queueUbiLogger;

    makeAutoObservable(this, {
      playerStore: false,
      queueStore: false,
      viewStore: false,
      hardwareStore: false,
      interappActions: false,
      animateSliding: false,
    });

    this.queueStore.onQueueUpdateCurrent(() => {
      this.setSelectedItemOnQueueChange();
    });
  }

  selectedItem: QueueItem | undefined;

  get selectedItemIndex(): number {
    return this.queue.findIndex(
      (item) => this.selectedItem?.queue_index === item.queue_index,
    );
  }

  get selectedItemFromManualQueue(): boolean {
    return this.selectedItem?.provider === 'queue';
  }

  get isSelectingFirst(): boolean {
    return this.selectedItemIndex === 0;
  }

  get showGradientBackground(): boolean {
    return this.isSelectingFirst || this.isEmptyQueue;
  }

  get queue(): QueueItem[] {
    return this.queueStore.next;
  }

  get currentPlayingImageId(): string {
    return this.playerStore.currentImageId;
  }

  get colors() {
    return this.imageStore.colors;
  }

  get isDialPressed(): boolean {
    return this.hardwareStore.dialPressed;
  }

  get shouldShowSmallHeader(): boolean {
    return this.queue.length > 0 && !this.isSelectingFirst;
  }

  get headerText(): string {
    if (this.selectedItemFromManualQueue || this.isEmptyQueue) {
      return 'Next in Queue:';
    } else if (this.queueStore.current.provider === 'queue') {
      if (!this.playerStore.contextTitle) {
        // contextTitle is sometimes missing (eg on podcasts)
        return 'Next Up:';
      }
      return `Next From: ${this.playerStore.contextTitle}`;
    }
    return `Next From: ${titleBasedOnType(this.playerStore, this.queueStore)}`;
  }

  get leftItem(): QueueItem | undefined {
    if (this.selectedItemIndex <= 0) {
      return this.selectedItem;
    }
    return this.queue[this.selectedItemIndex - 1];
  }

  get rightItem(): QueueItem | undefined {
    if (
      this.selectedItemIndex === this.queue.length - 1 ||
      this.selectedItemIndex < 0
    ) {
      return this.selectedItem;
    }
    return this.queue[this.selectedItemIndex + 1];
  }

  get headerBackground(): string {
    const colorChannels = get(this.colors, this.currentPlayingImageId) || [
      0, 0, 0,
    ];
    return `linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.84) 100%), rgb(${colorChannels.join(
      ',',
    )})`;
  }

  get isEmptyQueue(): boolean {
    return this.queue.length === 0;
  }

  resetDialDown() {
    this.hardwareStore.setDialPressed(false);
  }

  displayQueue(): void {
    this.updateSelectedItem(this.queueStore.next[0]);
    this.viewStore.showQueue();
  }

  setSelectedItemOnQueueChange(): void {
    const previousInNewQueue = this.queue.find(
      (item) => item.identifier === this.selectedItem?.identifier,
    );
    if (this.selectedItemIndex === 0 || this.selectedItem === undefined) {
      this.updateSelectedItem(this.queueStore.next[0]);
    } else if (
      this.selectedItemIndex > 0 &&
      this.queueStore.isNewCurrent(this.selectedItem)
    ) {
      this.updateSelectedItem(this.queueStore.next[0]);
    } else if (previousInNewQueue) {
      if (previousInNewQueue) {
        this.updateSelectedItem(previousInNewQueue, false);
      }
    }
  }

  handleDraggedToIndex(index: number): void {
    const userDraggedToItem = this.queue.find(
      (_, itemIndex) => index === itemIndex,
    );
    if (userDraggedToItem) {
      this.viewStore.showQueue();
      this.updateSelectedItem(userDraggedToItem);
    }
  }

  updateSelectedItem(item: QueueItem, withAnimation = true): void {
    this.animateSliding = withAnimation;
    this.selectedItem = item;
  }

  playItem(queueItem: QueueItem): void {
    this.playerStore.setPlaying(true);
    this.playerStore.skipToIndex(queueItem.queue_index);
  }

  handleItemClicked(item: QueueItem): void {
    this.queueUbiLogger.logTrackRowClicked(item.queue_index, item.uri);
    this.playItem(item);
    this.selectedItem = undefined;
    // to keep Queue in viewStack to enable going back as desired
    this.viewStore.showNpv();
  }

  handleDialPress(): void {
    if (this.selectedItem) {
      this.queueUbiLogger.logDialPressTrackRow(
        this.selectedItemIndex,
        this.selectedItem.uri,
      );
      this.playItem(this.selectedItem);
      // to keep Queue in viewStack to enable going back as desired
      this.viewStore.showNpv();
    }
  }

  handleBack(): void {
    if (this.selectedItemIndex >= 1) {
      this.updateSelectedItem(this.queueStore.next[0]);
      this.viewStore.showQueue();
    } else {
      this.queueUbiLogger.logBackButtonPressed();
      this.viewStore.back();
    }
  }

  handleDialRight(): void {
    this.viewStore.showQueue();
    if (this.rightItem) {
      this.updateSelectedItem(this.rightItem);
    }
  }

  handleDialLeft(): void {
    this.viewStore.showQueue();
    if (this.leftItem) {
      this.updateSelectedItem(this.leftItem);
    }
  }

  logQueueImpression = () => {
    this.queueUbiLogger.logImpression();
  };
}

export default QueueUiState;

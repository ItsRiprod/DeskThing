import { makeAutoObservable } from 'mobx';
import ShelfStore, {
  ItemType,
  ShelfItem,
  VOICE_IDENTIFIER,
} from 'store/ShelfStore';
import ContentShelfUbiLogger from 'eventhandler/ContentShelfUbiLogger';
import PlayerStore from 'store/PlayerStore';
import HardwareStore from 'store/HardwareStore';
import VoiceStore from 'store/VoiceStore';
import RemoteConfigStore from 'store/RemoteConfigStore';
import NpvStore from 'store/NpvStore';

export default class ShelfSwiperItemUiState {
  shelfStore: ShelfStore;
  playerStore: PlayerStore;
  hardwareStore: HardwareStore;
  voiceStore: VoiceStore;
  remoteConfigStore: RemoteConfigStore;
  npvStore: NpvStore;
  contentShelfUbiLogger: ContentShelfUbiLogger;

  constructor(
    shelfStore: ShelfStore,
    playerStore: PlayerStore,
    hardwareStore: HardwareStore,
    voiceStore: VoiceStore,
    remoteConfigStore: RemoteConfigStore,
    npvStore: NpvStore,
    contentShelfUbiLogger: ContentShelfUbiLogger,
  ) {
    makeAutoObservable(this, {
      shelfStore: false,
      playerStore: false,
      hardwareStore: false,
      voiceStore: false,
      remoteConfigStore: false,
      npvStore: false,
      contentShelfUbiLogger: false,
    });

    this.shelfStore = shelfStore;
    this.playerStore = playerStore;
    this.hardwareStore = hardwareStore;
    this.voiceStore = voiceStore;
    this.remoteConfigStore = remoteConfigStore;
    this.npvStore = npvStore;
    this.contentShelfUbiLogger = contentShelfUbiLogger;
  }

  get isDialPressed(): boolean {
    return this.hardwareStore.dialPressed;
  }

  get isPlaying(): boolean {
    return this.playerStore.playing;
  }

  get isMicEnabled() {
    return !this.voiceStore.isMicMuted;
  }

  get showPushToTalk() {
    return this.remoteConfigStore.pushToTalkShelfEnabled;
  }

  get graphQlEnabled() {
    return this.remoteConfigStore.graphQLShelfEnabled;
  }

  showNowPlaying(uri: string | undefined): boolean {
    return this.playerStore.contextUri === uri;
  }

  getcategoryItemTitle(itemCategory: string): string | undefined {
    return this.shelfStore.shelfController
      .getCategoryFromId(itemCategory)
      ?.title.toLowerCase();
  }

  isHidden(item: ShelfItem): boolean {
    const index = this.shelfStore.shelfController.getItemIndex(
      item,
      this.shelfStore.shelfItems,
    );
    return (
      (this.isTextPlaceholder(item) &&
        this.shelfStore.shelfItems[index - 2] &&
        this.isTextPlaceholder(this.shelfStore.shelfItems[index - 2]) &&
        index !== this.shelfStore.shelfController.selectedItemIndex) ||
      this.shouldHideVoiceTextItem(item, index)
    );
  }

  shouldHideVoiceTextItem(item: ShelfItem, index: number): boolean {
    if (this.remoteConfigStore.pushToTalkShelfEnabled) {
      return (
        item.category === VOICE_IDENTIFIER &&
        this.isTextPlaceholder(item) &&
        this.shelfStore.shelfItems.length > index + 2 &&
        this.isVoiceDefaultItem(this.shelfStore.shelfItems[index - 1]) &&
        this.shelfStore.shelfController.selectedItemIndex !== undefined &&
        index < this.shelfStore.shelfController.selectedItemIndex
      );
    }
    return false;
  }

  isLeftItem(item: ShelfItem): boolean {
    if (this.shelfStore.shelfController.selectedItemIndex !== undefined) {
      return (
        this.shelfStore.shelfController.getItemIndex(
          item,
          this.shelfStore.shelfItems,
        ) < this.shelfStore.shelfController.selectedItemIndex
      );
    }
    return false;
  }

  isTextPlaceholder(item: ShelfItem): boolean {
    if (item.category) {
      return (
        (item.category !== VOICE_IDENTIFIER &&
          item.type === ItemType.UNPLAYABLE_ITEM) ||
        this.isVoiceTextPlaceholder(item)
      );
    }
    return false;
  }

  isMoreItem(item: ShelfItem): boolean {
    return item.type === ItemType.MORE;
  }

  isContextItem(item: ShelfItem): boolean {
    return (
      item.type === ItemType.PLAYABLE_ITEM || this.isValidVoiceContextItem(item)
    );
  }

  isSpacerItem(item: ShelfItem): boolean {
    return item.type === ItemType.SPACER;
  }

  isVoiceTextPlaceholder(item: ShelfItem): boolean {
    if (this.remoteConfigStore.pushToTalkShelfEnabled) {
      return (
        item.category === VOICE_IDENTIFIER &&
        item.type === ItemType.SPACER &&
        item.identifier !== 'spacer-2'
      );
    }
    return false;
  }

  isValidVoiceContextItem(item: ShelfItem): boolean {
    if (item.category === VOICE_IDENTIFIER) {
      if (this.remoteConfigStore.pushToTalkShelfEnabled) {
        return ![
          ItemType.MORE,
          ItemType.UNPLAYABLE_ITEM,
          ItemType.SPACER,
        ].includes(item.type);
      }
      return item.type !== ItemType.MORE;
    }
    return false;
  }

  isVoiceDefaultItem(item: ShelfItem): boolean {
    return (
      this.remoteConfigStore.pushToTalkShelfEnabled &&
      item.category === VOICE_IDENTIFIER &&
      item.type === ItemType.UNPLAYABLE_ITEM
    );
  }

  /**
   * Actions
   */
  logMoreItemImpression(category: string) {
    this.contentShelfUbiLogger.logMoreButtonImpression(category);
  }

  logContextItemImpression(uri: string | undefined, category: string) {
    if (uri) {
      this.contentShelfUbiLogger.logShelfArtworkImpression(
        category,
        this.shelfStore.shelfController.getIndexOfItemInCategory(uri, category),
        uri,
      );
    }
  }

  logPushToTalkVoiceItemImpression(categoryId: string) {
    this.contentShelfUbiLogger.logPushToTalkButtonImpression(categoryId);
  }

  artworkClicked(item: ShelfItem): void {
    let interactionId;
    if (item.uri) {
      interactionId = this.contentShelfUbiLogger.logShelfItemClicked(
        item.category,
        this.shelfStore.shelfController.getIndexOfItemInCategory(
          item.uri,
          item.category,
        ),
        item.uri,
      );
    }
    this.shelfStore.shelfController.handleItemSelected(item, interactionId);
  }

  moreButtonClicked(itemCategory: string): void {
    this.contentShelfUbiLogger.logMoreButtonClicked(itemCategory);
    this.shelfStore.shelfController.handleMoreButtonSelected(itemCategory);
  }

  pushToTalkClicked(item: ShelfItem): void {
    this.handlePushToTalk();
    this.contentShelfUbiLogger.logPushToTalkButtonClicked(item.category);
    this.shelfStore.shelfController.handlePushToTalkSelected(item);
  }

  pushToTalkDialPressed(itemCategory: string): void {
    this.contentShelfUbiLogger.logPushToTalkButtonDialPressed(itemCategory);
    this.handlePushToTalk();
  }

  handlePushToTalk() {
    if (this.isMicEnabled) {
      this.voiceStore.handleManualVoiceSessionStart();
    } else {
      this.shelfStore.shelfController.voiceMuteBannerUiState.triggerBanner();
    }
  }
}

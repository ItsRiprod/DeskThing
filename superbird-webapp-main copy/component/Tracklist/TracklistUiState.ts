import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from 'store/RootStore';
import { transitionDurationMs } from 'style/Variables';
import {
  isCollectionUri,
  isPlaylistRecommendedUri,
  isTrackOrEpisode,
} from 'helpers/SpotifyUriUtil';
import {
  isPlaylistV1OrV2URI,
  isSearchURI,
  isShowURI,
  isStationURI,
  isTrackURI,
  parseURI,
  URITypeMap,
} from '@spotify-internal/uri';
import { titleBasedOnType } from 'helpers/ContextTitleExtractor';
import { getTrackViewFeatureIdentifier } from 'helpers/FeatureIdentifiers';
import { HOME_IDENTIFIER } from 'store/ShelfStore';
import { ChildrenOfItemResponseItem } from 'store/ChildItemStore';
import { GetPodcastResponseItem } from 'store/PodcastStore';

const PAGE_SIZE = 10;
const MIN_DISTANCE_FROM_END = 5;

export type TrackItem = ChildrenOfItemResponseItem & GetPodcastResponseItem;

export type ContextItem = {
  uri: string;
  title: string;
  image_id?: string;
};

export const isSupportedUriType = (uri: string): boolean =>
  !(isTrackOrEpisode(uri) || isSearchURI(uri) || isPlaylistRecommendedUri(uri));

class TracklistUiState {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      animateSliding: false,
      confirmationTimeoutId: false,
    });

    this.rootStore = rootStore;

    rootStore.playerStore.onContextChange((uri) => {
      if (uri) {
        this.onPlayerStoreUriUpdated(uri);
      }
    });

    rootStore.playerStore.onTrackChange(() => this.handleTrackChange());
  }

  contextItem: ContextItem = { uri: '', title: '' };
  selectedItem: TrackItem | undefined;
  animateSliding: boolean = false;
  showAddToQueueSuccess = false;
  confirmationTimeoutId?: number;

  reset(): void {
    this.contextItem = { uri: '', title: '' };
    this.selectedItem = undefined;
    this.animateSliding = false;
  }

  initializeTracklist(contextItem: ContextItem) {
    if (contextItem.uri === this.contextUri) {
      this.updateSelectedItem(this.currentlyPlayingTrackOrFirst, false);
      return;
    }

    this.reset();
    this.animateSliding = false;
    this.contextItem = contextItem;

    if (this.initiallySelectedItem) {
      // context has been loaded before and items are available.
      this.updateSelectedItem(this.initiallySelectedItem, false);
      return;
    }
    this.rootStore.savedStore.loadSavedState(contextItem.uri);
    this.loadInitialItems(contextItem.uri);
  }

  get shouldShowLatestPlayedEpisode(): boolean {
    return (
      this.isPodcastContext &&
      this.rootStore.podcastStore.shouldShowLatestPlayedEpisode(this.contextUri)
    );
  }

  get latestPlayedEpisode(): TrackItem | undefined {
    return this.isPodcastContext
      ? this.tracksList.find(
          (trackItem) =>
            trackItem.uri ===
            this.rootStore.podcastStore.getLatestPlayedUri(this.contextUri),
        )
      : undefined;
  }

  get initiallySelectedItem(): TrackItem {
    if (this.isNowPlayingContext) {
      return this.currentlyPlayingTrackOrFirst;
    } else if (this.shouldShowLatestPlayedEpisode) {
      if (this.latestPlayedEpisode) {
        return this.latestPlayedEpisode;
      }

      this.rootStore.errorHandler.logUnexpectedError(
        new Error(
          'Should scroll to the latest played podcast episode, but it was not in the list of episodes',
        ),
      );
    }

    return this.tracksList[0];
  }

  async loadInitialItems(uri: string): Promise<void> {
    if (isStationURI(uri)) {
      return;
    }

    const { childItemStore, podcastStore, onboardingStore, viewStore } =
      this.rootStore;

    if (isShowURI(uri)) {
      await podcastStore.loadFromBeginning(uri, 10);
    } else if (isSupportedUriType(uri)) {
      await childItemStore.loadChildData(uri, 10);
    }

    runInAction(() => {
      this.updateSelectedItem(this.initiallySelectedItem, false);

      if (this.isError && viewStore.isOnboarding) {
        onboardingStore.handleTracklistError();
      }
    });
  }

  get isLoading(): boolean {
    if (isStationURI(this.contextUri)) {
      return false;
    }
    return this.isPodcastContext
      ? this.rootStore.podcastStore.isLoading(this.contextUri)
      : this.rootStore.childItemStore.isLoading(this.contextUri);
  }

  get isError(): boolean {
    if (isStationURI(this.contextUri)) {
      return false;
    }

    return this.isPodcastContext
      ? this.rootStore.podcastStore.isError(this.contextUri)
      : this.rootStore.childItemStore.isError(this.contextUri);
  }

  get isNowPlayingContext(): boolean {
    return this.contextUri === this.rootStore.playerStore.contextUri;
  }

  get totalInContext(): number {
    return this.isPodcastContext
      ? this.rootStore.podcastStore.getTotalNumberOfItems(this.contextUri)
      : this.rootStore.childItemStore.getTotal(this.contextUri);
  }

  get tracksList(): Array<TrackItem> {
    if (isStationURI(this.contextUri)) {
      return this.rootStore.radioStore.currentRadioTracks;
    }

    return (
      (
        isShowURI(this.contextUri)
          ? this.rootStore.podcastStore.getPodcastItemsIncludingTrailer(
              this.contextUri,
            )
          : this.rootStore.childItemStore.getLoadedChildren(this.contextUri)
      )
        // Some context types contain non-track types on android, e.g. shuffle buttons
        .filter((item) => isTrackOrEpisode(item.uri))
    );
  }

  get currentlyPlayingItemSelected(): boolean {
    const currentlyPlayingTrackIndex = this.tracksList.findIndex(
      (item: TrackItem) =>
        item.uri === this.rootStore.playerStore.currentTrack.uri,
    );
    return (
      currentlyPlayingTrackIndex >= 0 &&
      currentlyPlayingTrackIndex === this.selectedItemIndex
    );
  }

  get browsingCurrentContext() {
    return this.contextUri === this.rootStore.playerStore.contextUri;
  }

  get currentTrackInTracklist(): boolean {
    return !!this.tracksList.find(
      (item: TrackItem) =>
        item.uri === this.rootStore.playerStore.currentTrack.uri,
    );
  }

  isStationAndNotCurrentlyPlaying(contextUri: string): boolean {
    return (
      isStationURI(contextUri) &&
      contextUri !== this.rootStore.playerStore.contextUri
    );
  }

  loadCurrentContext(): void {
    const { playerStore, shelfStore, queueStore } = this.rootStore;

    let imageId = playerStore.currentImageId;
    const items = shelfStore.getItemsByCategory(HOME_IDENTIFIER);
    if (items.length > 0) {
      const firstItem = items[0];
      if (
        firstItem.image_id &&
        isShowURI(playerStore.contextUri) &&
        firstItem.uri === playerStore.contextUri
      ) {
        imageId = firstItem.image_id;
      }
    }

    this.handleSupportedTracklists({
      uri: playerStore.contextUri,
      title: titleBasedOnType(playerStore, queueStore),
      image_id: imageId,
    });
  }

  handleSupportedTracklists(contextItem: ContextItem) {
    const { overlayController, viewStore } = this.rootStore;
    const contextUri = contextItem.uri;
    if (this.isStationAndNotCurrentlyPlaying(contextItem.uri)) {
      overlayController.maybeShowNotSupportedType(true);
    } else if (isTrackURI(contextUri) || isSearchURI(contextUri)) {
      viewStore.showNpv();
      return;
    } else {
      this.initializeTracklist(contextItem);
    }
  }

  get contextTitle(): string {
    return this.contextItem.title;
  }

  get contextUri(): string {
    return this.contextItem.uri;
  }

  get contextImage(): string | undefined {
    return this.contextItem.image_id;
  }

  get contextType(): string {
    return parseURI(this.contextUri)?.type ?? '';
  }

  get isAlbumContext(): boolean {
    return this.contextType === URITypeMap.ALBUM;
  }

  get isPodcastContext(): boolean {
    return isShowURI(this.contextUri);
  }

  get isPlayListContext(): boolean {
    return isPlaylistV1OrV2URI(this.contextUri);
  }

  get isPodcastOrAlbum(): boolean {
    return (
      this.contextType === URITypeMap.ALBUM ||
      this.contextType === URITypeMap.SHOW
    );
  }

  get rightItem(): TrackItem | undefined {
    if (
      this.selectedItemIndex === this.tracksList.length - 1 ||
      this.selectedItemIndex < 0
    ) {
      return this.selectedItem;
    }
    return this.tracksList[this.selectedItemIndex + 1];
  }

  get leftItem(): TrackItem | undefined {
    if (this.selectedItemIndex <= 0) {
      return this.selectedItem;
    }
    return this.tracksList[this.selectedItemIndex - 1];
  }

  get currentPlayingTrackUri() {
    return this.rootStore.playerStore.currentTrackUri;
  }

  get currentPlayingTrackUid() {
    return this.rootStore.playerStore.currentTrackUid;
  }

  get currentPlayingImageId() {
    return this.rootStore.playerStore.currentImageId;
  }

  get colors() {
    return this.rootStore.imageStore.colors;
  }

  get isDialPressed() {
    return this.rootStore.hardwareStore.dialPressed;
  }

  get shouldShowQueueConfirmation() {
    return this.showAddToQueueSuccess;
  }

  get selectedItemIndex(): number {
    return this.getIndexOfItem(this.selectedItem);
  }

  getIndexOfItem(trackItem?: TrackItem): number {
    if (isStationURI(this.contextUri)) {
      const indexById = this.tracksList.findIndex(
        (item) => trackItem?.id === item.id,
      );
      if (indexById > -1) return indexById;

      return this.tracksList.findIndex((item) => trackItem?.uri === item.uri);
    }
    return this.tracksList.findIndex((item) => trackItem === item);
  }

  setShouldShowAddToQueueBanner(show: boolean) {
    this.showAddToQueueSuccess = show;
  }

  clickAddToQueue(event: React.MouseEvent<HTMLDivElement>, item: TrackItem) {
    event.stopPropagation();
    this.logAddToQueueClicked(item);
    this.setShouldShowAddToQueueBanner(false);
    this.handleAddToQueue(item);
  }

  handleAddToQueue(item: TrackItem) {
    this.rootStore.queueStore
      .addToQueue(item.uri)
      .then(() => {
        this.setShouldShowAddToQueueBanner(true);
        this.confirmationTimeoutId = window.setTimeout(() => {
          this.setShouldShowAddToQueueBanner(false);
        }, 4_000);
      })
      .catch(() => {
        this.setShouldShowAddToQueueBanner(false);
      });
  }

  updateSelectedItem(item: TrackItem, withAnimation = true): void {
    if (this.isLoading) {
      return;
    }
    this.animateSliding = withAnimation;
    this.selectedItem = item;
    this.loadMore();
  }

  loadMore(): void {
    if (isStationURI(this.contextUri)) {
      return;
    }

    if (this.isPodcastContext) {
      this.rootStore.podcastStore.loadMore(
        this.contextUri,
        PAGE_SIZE,
        this.selectedItemIndex,
        MIN_DISTANCE_FROM_END,
      );
    } else {
      this.rootStore.childItemStore.loadMore({
        parentId: this.contextUri,
        pageSize: PAGE_SIZE,
        currentIndex: this.selectedItemIndex,
        numberOfItemsLoaded: this.rootStore.childItemStore.getNumberOfItems(
          this.contextUri,
        ),
        totalNumberOfItemsAvailable: this.rootStore.childItemStore.getTotal(
          this.contextUri,
        ),
        minDistanceFromEnd: MIN_DISTANCE_FROM_END,
      });
    }
  }

  handleDraggedToIndex(index: number): void {
    this.setShouldShowAddToQueueBanner(false);
    const userDraggedToItem = this.tracksList.find(
      (_, itemIndex) => index === itemIndex,
    );
    if (userDraggedToItem) {
      this.rootStore.viewStore.showTracklist();
      this.updateSelectedItem(userDraggedToItem);
    }
  }

  setAnimateSliding(animate: boolean) {
    this.animateSliding = animate;
  }

  private playItem(item: TrackItem, interactionId: string) {
    const { playerStore, queueStore, radioStore } = this.rootStore;

    playerStore.setPlaying(true);
    playerStore.setIsPodcast(this.isPodcastContext);
    queueStore.setCurrentTrackItem(item);

    if (isStationURI(this.contextUri)) {
      radioStore.playRadioItem(item.id);
    } else {
      if (item.isTrailer) {
        playerStore.playPodcastTrailer(this.contextUri);
      } else {
        playerStore.playUriFromContext(
          this.contextUri,
          item.uri,
          getTrackViewFeatureIdentifier(this.contextUri),
          interactionId,
          item.uid,
        );
      }
    }
  }

  handleItemSelected(item: TrackItem, interactionId: string) {
    this.setShouldShowAddToQueueBanner(false);
    const { playerStore, viewStore } = this.rootStore;
    const canCompareUid = item.uid && playerStore.currentTrack.uid;
    const isTrackInContext =
      this.contextUri === playerStore.contextUri &&
      (canCompareUid
        ? item.uid === playerStore.currentTrack.uid
        : item.uri === playerStore.currentTrack.uri);

    if (isTrackInContext && !playerStore.playing) {
      playerStore.play();
    } else if (!isTrackInContext) {
      this.playItem(item, interactionId);
    }
    viewStore.showNpv();
    window.setTimeout(
      () => this.updateSelectedItem(item),
      transitionDurationMs,
    );
  }

  toggleIsSaved() {}

  get isSelectingFirst(): boolean {
    return this.selectedItemIndex === 0;
  }

  get smallHeader(): boolean {
    return this.tracksList.length > 0 && !this.isSelectingFirst;
  }

  get shouldShowHeart(): boolean {
    return !isCollectionUri(this.contextUri) && !isStationURI(this.contextUri);
  }

  get isLiked(): boolean {
    return this.rootStore.savedStore.isSaved(this.contextUri);
  }

  get currentlyPlayingTrackOrFirst(): TrackItem {
    const currentlyPlayingTrackUri =
      this.rootStore.playerStore.currentTrack.uri;
    const currentlyPlayingItem = this.tracksList.find(
      (item: TrackItem) => item.uri === currentlyPlayingTrackUri,
    );
    return currentlyPlayingItem || this.tracksList[0];
  }

  setIsSaved(isSaved: boolean) {
    this.rootStore.savedStore.setSaved(this.contextUri, isSaved);
  }

  handleTrackChange() {
    const currentContextUri = this.rootStore.playerStore.contextUri;
    if (this.contextUri !== currentContextUri) {
      return;
    }

    const currentlyPlayingTrack = this.tracksList.find(
      (item: TrackItem) =>
        item.uri === this.rootStore.playerStore.currentTrack.uri,
    );

    if (currentlyPlayingTrack && !this.rootStore.viewStore.isTracklist) {
      this.updateSelectedItem(currentlyPlayingTrack);
    } else if (
      isStationURI(this.contextUri) &&
      this.selectedItemIndex === -1 &&
      this.browsingCurrentContext
    ) {
      const newItem = this.tracksList.find(
        (item) => this.selectedItem?.uri === item.uri,
      );
      if (newItem) {
        this.updateSelectedItem(newItem, false);
      }
    }
  }

  async onPlayerStoreUriUpdated(uri: string) {
    if (this.rootStore.playerStore.isPlayingOtherMedia) {
      return;
    }

    this.rootStore.savedStore.loadSavedState(uri);
    if (isStationURI(uri)) {
      return;
    } else if (isShowURI(uri)) {
      await this.rootStore.podcastStore.loadWholeShow(uri);
    } else if (isSupportedUriType(uri)) {
      await this.rootStore.childItemStore.getChildItems(uri, 10000);
    }

    runInAction(() => {
      if (this.contextUri === uri) {
        this.updateSelectedItem(this.initiallySelectedItem);
      }
    });
  }

  logContextImpression(): void {
    this.rootStore.ubiLogger.trackListUbiLogger.logImpression(this.contextUri);
  }

  logContextItemImpression(item: TrackItem): void {
    this.rootStore.ubiLogger.trackListUbiLogger.logTracklistItemImpression(
      this.contextUri,
      item.uri,
      this.getIndexOfItem(item),
    );
  }

  logTrackRowClicked(item: TrackItem): string {
    return this.rootStore.ubiLogger.trackListUbiLogger.logTrackRowClicked(
      this.getIndexOfItem(item),
      item.uri,
      this.contextUri,
    );
  }

  logRemoveLike() {
    this.rootStore.ubiLogger.trackListUbiLogger.logContextRemoveLike(
      this.contextUri,
    );
  }

  logLike() {
    this.rootStore.ubiLogger.trackListUbiLogger.logContextLiked(
      this.contextUri,
    );
  }

  logTracklistItemLongPress() {
    if (this.selectedItem) {
      this.rootStore.ubiLogger.trackListUbiLogger.logAddToQueueDialLongPress(
        this.selectedItemIndex,
        this.selectedItem.uri,
        this.contextUri,
      );
    }
  }

  logAddToQueueClicked(item: TrackItem) {
    this.rootStore.ubiLogger.trackListUbiLogger.logAddToQueueClicked(
      this.getIndexOfItem(item),
      item.uri,
      this.contextUri,
    );
  }
}

export default TracklistUiState;

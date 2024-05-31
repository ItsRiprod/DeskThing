import { action, makeAutoObservable, reaction } from 'mobx';
import Socket from '../Socket';
import { TrackItem } from 'component/Tracklist/TracklistUiState';
import InterappActions from 'middleware/InterappActions';
import QueueUiState from 'component/Queue/QueueUiState';
import PlayerStore from './PlayerStore';
import ImageStore from './ImageStore';
import ViewStore from './ViewStore';
import HardwareStore from './HardwareStore';
import QueueUbiLogger from 'eventhandler/QueueUbiLogger';

export type PROVIDER = 'context' | 'queue' | 'mft/inject_filler_tracks';

export enum POSITION {
  PREVIOUS = 'PREVIOUS',
  CURRENT = 'CURRENT',
  NEXT = 'NEXT',
}

export interface QueueItem extends QueueEventItem {
  identifier: string;
  queue_index: number;
}

export const defaultItem: QueueItem = {
  uid: '',
  image_uri: '',
  provider: 'context',
  uri: '',
  name: '',
  artist_name: '',
  identifier: POSITION.CURRENT,
  queue_index: 0,
};

type QueueEventItem = {
  artist_name?: string;
  artists?: Artist[];
  image_uri: string;
  name: string;
  provider: PROVIDER;
  uid: string;
  uri: string;
};

type Artist = {
  name: string;
  uri: string;
};

export type QueueEventPayload = QueueEvent['payload'];

export type QueueEvent = {
  payload: {
    previous: Array<QueueEventItem>;
    current: QueueEventItem | null; // Android might return null;
    next: Array<QueueEventItem>;
  };
  type: 'com.spotify.play_queue';
};

export const isAllowedUriType = (item: { uri: string }) =>
  item &&
  item.uri !== 'spotify:delimiter' &&
  !item.uri.startsWith('spotify:meta:');

export const shouldDropQueueEvent = ({
  payload: { next, current },
}: QueueEvent): boolean => {
  const noRealQueueItems = !next.filter((item) => isAllowedUriType(item))
    .length;
  const noRealCurrent = !current || !current.uri;

  return noRealQueueItems && noRealCurrent;
};

export const getArtistNames = (artistName?: string, artists?: Artist[]) => {
  if (artists && artists?.length > 0) {
    return artists
      .filter((artist) => !!artist?.name)
      .map((artist) => artist.name)
      .join(', ');
  }
  return artistName;
};

export const decorateQueueItem = action(
  (
    queueEventItem: QueueEventItem,
    index: number,
    position: POSITION,
  ): QueueItem =>
    Object.assign(queueEventItem, {
      identifier: `${queueEventItem.uid || queueEventItem.uri}-${position}`,
      queue_index: index,
      artist_name: getArtistNames(
        queueEventItem.artist_name,
        queueEventItem.artists,
      ),
    }),
);

class QueueStore {
  _previous: QueueEventItem[] = [];
  _current: QueueEventItem = defaultItem;
  _next: QueueEventItem[] = [];
  playerStore: PlayerStore;
  imageStore: ImageStore;
  viewStore: ViewStore;
  hardwareStore: HardwareStore;
  interappActions: InterappActions;
  queueUiState: QueueUiState;

  constructor(
    socket: Socket,
    playerStore: PlayerStore,
    imageStore: ImageStore,
    viewStore: ViewStore,
    hardwareStore: HardwareStore,
    queueUbiLogger: QueueUbiLogger,
    interappActions: InterappActions,
  ) {
    makeAutoObservable(this, {
      playerStore: false,
      imageStore: false,
      viewStore: false,
      hardwareStore: false,
      queueUiState: false,
      interappActions: false,
    });

    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
    this.playerStore = playerStore;
    this.imageStore = imageStore;
    this.viewStore = viewStore;
    this.hardwareStore = hardwareStore;
    this.queueUiState = new QueueUiState(
      this.playerStore,
      this,
      this.imageStore,
      this.viewStore,
      this.hardwareStore,
      queueUbiLogger,
      interappActions,
    );

    this.interappActions = interappActions;
  }

  get previous(): QueueItem[] {
    return this._previous
      .filter((item) => isAllowedUriType(item))
      .map((item, index, items) =>
        decorateQueueItem(item, -1 * (items.length - index), POSITION.PREVIOUS),
      );
  }

  get next(): QueueItem[] {
    return this._next
      .filter((item) => isAllowedUriType(item))
      .map((item, index) => decorateQueueItem(item, index + 1, POSITION.NEXT));
  }

  get current(): QueueItem {
    return decorateQueueItem(this._current, 0, POSITION.CURRENT);
  }

  get isCurrentProviderQueue(): boolean {
    return this.current.provider === 'queue';
  }

  get isPlayingSuggestedSong(): boolean {
    return this.current.provider === 'mft/inject_filler_tracks';
  }

  isNewCurrent(item: QueueItem) {
    const isSameUid = item.uid === this._current.uid;
    const isSameUri = item.uri === this._current.uri;

    return isSameUid || isSameUri;
  }

  addToQueue(uri: string) {
    return this.interappActions.addToQueue(uri);
  }

  onMiddlewareEvent(msg: QueueEvent): void {
    switch (msg.type) {
      case 'com.spotify.play_queue':
        if (!shouldDropQueueEvent(msg)) {
          this._previous = msg.payload.previous ?? [];
          this._current = msg.payload.current ?? defaultItem;
          this._next = msg.payload.next ?? [];
        }
        break;
      default:
        break;
    }
  }

  /**
   * Sets the currently playing item in the queue from a given `TrackItem`. Useful when locally updating state when
   * initiating playback from a TrackItem.
   */
  setCurrentTrackItem(item: TrackItem): void {
    this._current.uri = item.uri;
    this._current.image_uri = item.image_id;
    this._current.name = item.title;
    this._current.artist_name = item.subtitle;
  }

  /**
   * Sets the currently playing item in the queue from a given `QueueItem`. Useful when skipping in the queue to locally
   * update the state.
   */
  setCurrentQueueItem(item: QueueItem): void {
    this._current = decorateQueueItem(item, 0, POSITION.CURRENT);
  }

  reset() {
    this._previous = [];
    this._current = defaultItem;
    this._next = [];
  }

  get previousItem(): QueueItem | undefined {
    return this.previous.length ? this.previous[0] : undefined;
  }

  get nextItem(): QueueItem | undefined {
    return this.next.length ? this.next[0] : undefined;
  }

  onQueueUpdateCurrent(callback: () => void) {
    reaction(
      () => this._current,
      () => {
        callback();
      },
    );
  }
}

export default QueueStore;

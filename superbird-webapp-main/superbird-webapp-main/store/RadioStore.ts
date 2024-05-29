import { RootStore } from './RootStore';
import { action, makeAutoObservable } from 'mobx';
import { QueueItem } from './QueueStore';
import { TrackItem } from 'component/Tracklist/TracklistUiState';

const uniqueByIdentifier = (items: QueueItem[]): QueueItem[] => {
  const seen = {};
  return items.filter((item) =>
    seen[item.identifier] ? false : (seen[item.identifier] = true),
  );
};

const queueItemToTracklistItem = action((queueItem: QueueItem): TrackItem => {
  return Object.assign(queueItem, {
    available_offline: false,
    content_description: '',
    has_children: false,
    id: queueItem.identifier,
    image_id: queueItem.image_uri ?? '',
    playable: true,
    subtitle: queueItem.artist_name ?? '',
    title: queueItem.name,
    uri: queueItem.uri,
  });
});

class RadioStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  get currentRadioTracks(): TrackItem[] {
    const { queueStore } = this.rootStore;
    return [
      ...uniqueByIdentifier(queueStore.previous),
      queueStore.current,
      ...uniqueByIdentifier(queueStore.next),
    ]
      .filter((queueItem) => queueItem.provider === 'context')
      .map(queueItemToTracklistItem);
  }

  playRadioItem(id: string): void {
    const { queueStore } = this.rootStore;

    const queueItem = [...queueStore.previous, ...queueStore.next].find(
      (item) => item.identifier === id,
    );

    if (queueItem) {
      this.rootStore.playerStore.skipToIndex(queueItem.queue_index);
    }
  }
}

export default RadioStore;

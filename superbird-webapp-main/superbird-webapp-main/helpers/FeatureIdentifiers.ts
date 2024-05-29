import { parseURI, URITypeMap } from '@spotify-internal/uri';
import VoiceStore from 'store/VoiceStore';
import ShelfStore, { ShelfItem, VOICE_IDENTIFIER } from 'store/ShelfStore';
import {
  NO_INTENT,
  PLAY_INTENT,
  SEARCH_INTENT,
  SHOW_INTENT,
} from 'component/VoiceConfirmation/VoiceConfirmationIntents';

const defaultTrackViewFeatureIdentifier = 'car-thing-entity-page';
const trackViewFeatureIdentifierMap = {
  [URITypeMap.ALBUM]: 'car-thing-album',
  [URITypeMap.COLLECTION_ALBUM]: 'car-thing-collection-album',
  [URITypeMap.ARTIST]: 'car-thing-artist',
  [URITypeMap.COLLECTION_ARTIST]: 'car-thing-collection-artist',
  [URITypeMap.PLAYLIST]: 'car-thing-playlist',
  [URITypeMap.PLAYLIST_V2]: 'car-thing-playlist',
  [URITypeMap.COLLECTION]: 'car-thing-collection',
  [URITypeMap.SHOW]: 'car-thing-podcast',
};
export const FEATURE_IDENTIFIER_ALTERNATIVE_SEARCH =
  'car-thing-alternative-search';
export const FEATURE_IDENTIFIER_SHOW_ME = 'car-thing-show-me';
export const FEATURE_IDENTIFIER_VOICE = 'car-thing-voice';
export const FEATURE_IDENTIFIER_CONTENT_SHELF = 'car-thing-content-shelf';

const isFirstVoiceItem = (item: ShelfItem, shelfStore: ShelfStore) => {
  return (
    shelfStore.shelfController.getIndexOfItemInCategory(
      item.uri,
      item.category,
    ) === 0
  );
};

const isShowIntent = (intent: string) => {
  return intent === SHOW_INTENT || intent === SEARCH_INTENT;
};

const isPlayRequest = (voiceStore: VoiceStore) => {
  return voiceStore.intent === PLAY_INTENT || voiceStore.intent === NO_INTENT;
};

let trackViewFeatureIdentifier: string | null = null;
export const setTrackViewFeatureIdentifier = (
  newFeatureIdentifier: string | null,
) => {
  trackViewFeatureIdentifier = newFeatureIdentifier;
};

export const getTrackViewFeatureIdentifier = (contextUri: string) => {
  if (trackViewFeatureIdentifier) {
    return trackViewFeatureIdentifier; // If there's been a manually set feature identifier, use that.
  }
  const uri = parseURI(contextUri);
  if (!uri) {
    return defaultTrackViewFeatureIdentifier;
  }

  return (
    trackViewFeatureIdentifierMap[uri.type] || defaultTrackViewFeatureIdentifier
  );
};

export const setTrackViewVoiceFeatureIdentifier = (
  selectedItem: ShelfItem,
  voiceStore: VoiceStore,
  shelfStore: ShelfStore,
) => {
  if (isFirstVoiceItem(selectedItem, shelfStore) && isPlayRequest(voiceStore)) {
    // If the user clicks the first track, it's what we already started playing on the phone. Use the same feature
    // identifier as the phone in those cases.
    setTrackViewFeatureIdentifier(FEATURE_IDENTIFIER_VOICE);
  } else {
    // Depending on the user's intent we use different feature identifiers.
    setTrackViewFeatureIdentifier(
      isShowIntent(voiceStore.intent)
        ? FEATURE_IDENTIFIER_SHOW_ME
        : FEATURE_IDENTIFIER_ALTERNATIVE_SEARCH,
    );
  }
};

export const getShelfFeatureIdentifierForTrackOrEpisode = (
  selectedItem: ShelfItem,
  shelfStore: ShelfStore,
  voiceStore: VoiceStore,
) => {
  if (selectedItem.category === VOICE_IDENTIFIER) {
    if (
      isFirstVoiceItem(selectedItem, shelfStore) &&
      isPlayRequest(voiceStore)
    ) {
      // If the user clicks the first track, it's what we already started playing on the phone. Use the same feature
      // identifier as the phone in those cases.
      return FEATURE_IDENTIFIER_VOICE;
    }
    // Depending on the user's intent we use different feature identifiers.
    return isShowIntent(voiceStore.intent)
      ? FEATURE_IDENTIFIER_SHOW_ME
      : FEATURE_IDENTIFIER_ALTERNATIVE_SEARCH;
  }

  return FEATURE_IDENTIFIER_CONTENT_SHELF;
};

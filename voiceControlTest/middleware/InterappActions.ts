import MiddlewareRequest from './MiddlewareRequest';
import { SetPresetRequest, SetPresetResponse } from 'store/PresetsDataStore';
import { PermissionStatusResponse } from 'store/PermissionStore';
import { ErrorCategory } from 'eventhandler/ErrorHandler';
// import { IBacktraceData } from 'backtrace-js/lib/model/backtraceData';
import { UbiProd1InteractionEvent } from '@spotify-internal/event-definitions/src/events/createUbiProd1Interaction';
import { UbiProd1ImpressionEvent } from '@spotify-internal/event-definitions/src/events/createUbiProd1Impression';
import InterappError from './InterappError';
import { UbiImpression, UbiInteraction } from 'eventhandler/UbiLogger';
import { RequestLog } from 'helpers/RequestLogger';
import {
  GraphHomeMoreResponsePayload,
  GraphHomeResponsePayload,
  HomeGraphOverridesReq,
  HomeOverridesRequest,
  HomeResponsePayload,
} from 'store/HomeItemsStore';
import {
  getPresetsQuery,
  getShelfQuery,
  getShelfSectionQuery,
  getTipsOnDemandQuery,
} from 'middleware/Queries';

type RepeatMode = 'TRACK' | 'CONTEXT' | 'NONE';

export const InterappMethods = {
  CrashReport: 'com.spotify.superbird.crashes.report',
  Earcon: 'com.spotify.superbird.earcon',
  GetAvailablePodcastPlaybackSpeeds:
    'com.spotify.get_available_podcast_playback_speeds',
  GetCapabilities: 'com.spotify.get_capabilities',
  GetChildrenOfItem: 'com.spotify.get_children_of_item',
  GetHome: 'com.spotify.superbird.get_home',
  GetCrossfadeState: 'com.spotify.get_crossfade_state',
  GetCurrentContext: 'com.spotify.get_current_context',
  GetCurrentTrack: 'com.spotify.get_current_track',
  GetImage: 'com.spotify.get_image',
  GetItemForURI: 'com.spotify.get_items_for_uris',
  GetNextTracks: 'com.spotify.get_next_tracks',
  GetPermissions: 'com.spotify.superbird.permissions',
  GetPlaybackSpeed: 'com.spotify.get_playback_speed',
  GetPlayerState: 'com.spotify.get_player_state',
  GetPodcast: 'com.spotify.superbird.get_podcast',
  GetPodcastPlaybackSpeed: 'com.spotify.get_podcast_playback_speed',
  GetPresets: 'com.spotify.superbird.presets.get_presets',
  GetRating: 'com.spotify.get_rating',
  GetRecommendedContentForType: 'com.spotify.get_recommended_content_for_type',
  GetRepeat: 'com.spotify.get_repeat',
  GetRootItem: 'com.spotify.get_root_item',
  GetSaved: 'com.spotify.get_saved',
  GetSessionState: 'com.spotify.get_session_state',
  GetShuffle: 'com.spotify.get_shuffle',
  GetThumbnailImage: 'com.spotify.get_thumbnail_image',
  GetTips: 'com.spotify.superbird.tipsandtricks.get_tips_and_tricks',
  GetTrackElapsed: 'com.spotify.get_track_elapsed',
  GetTts: 'com.spotify.superbird.tts.speak',
  Graph: 'com.spotify.superbird.graphql',
  LogMessage: 'com.spotify.log_message',
  PitstopLog: 'com.spotify.superbird.pitstop.log',
  _PlayItem: 'com.spotify.play_item',
  _PlayUri: 'com.spotify.play_uri',
  PlayPodcastTrailer: 'com.spotify.superbird.play_podcast_trailer',
  QueueUri: 'com.spotify.queue_spotify_uri',
  SearchQuery: 'com.spotify.search_query',
  _SeekToPosition: 'com.spotify.set_playback_position',
  _SetPlaybackSpeed: 'com.spotify.set_playback_speed',
  SetPodcastPlaybackSpeed: 'com.spotify.set_podcast_playback_speed',
  SetPreset: 'com.spotify.superbird.presets.set_preset',
  SetRating: 'com.spotify.set_rating',
  _SetRepeat: 'com.spotify.set_repeat',
  SetSaved: 'com.spotify.set_saved',
  _SetShuffle: 'com.spotify.set_shuffle',
  _SkipNext: 'com.spotify.skip_next',
  _SkipPrevious: 'com.spotify.skip_previous',
  SkipToIndex: 'com.spotify.skip_to_index_in_queue',
  StartRadio: 'com.spotify.start_radio',
  RequestLog: 'com.spotify.superbird.instrumentation.request',
  SendUbiInteraction: 'com.spotify.superbird.instrumentation.interaction',
  SendUbiImpression: 'com.spotify.superbird.instrumentation.impression',
  SendUbiBatch: 'com.spotify.superbird.instrumentation.log',
  PhoneAnswer: 'com.spotify.superbird.phone.answer',
  PhoneDecline: 'com.spotify.superbird.phone.decline',
  PhoneCallImage: 'com.spotify.superbird.phone.get_image',
  PhoneCallMessage: 'com.spotify.superbird.phone.send_message',
  IncreaseVolume: 'com.spotify.superbird.volume.volume_up',
  DecreaseVolume: 'com.spotify.superbird.volume.volume_down',

  PlayUri: 'com.spotify.superbird.play_uri',
  SkipNext: 'com.spotify.superbird.skip_next',
  SkipPrev: 'com.spotify.superbird.skip_prev',
  SeekTo: 'com.spotify.superbird.seek_to',
  Resume: 'com.spotify.superbird.resume',
  Pause: 'com.spotify.superbird.pause',
  SetShuffle: 'com.spotify.superbird.set_shuffle',
  SetRepeat: 'com.spotify.superbird.set_repeat',
};

export const INTERAPP_METHODS = Object.values(InterappMethods);

export enum Earcon {
  CONFIRMATION = 'confirmation',
  LISTENING = 'listening',
  ERROR = 'error',
}

export type PitstopLogEvent = {
  type: 'ui_error';
  timestamp: number;
  stacktrace: string;
  category: ErrorCategory;
};

class InterappActions {
  middlewareRequest: MiddlewareRequest;

  constructor(middlewareRequest: MiddlewareRequest) {
    this.middlewareRequest = middlewareRequest;
  }

  async doRequest(method: string, args: Object = {}, userAction = true) {
    try {
      return await this.middlewareRequest.request(method, args, userAction);
    } catch (e) {
      throw new InterappError(`Interapp error: ${e}`, method, args);
    }
  }

  playUri(
    uri: string,
    featureIdentifier: string,
    interactionId?: string,
    skipToUri?: string,
    skipToUid?: string,
  ) {
    return this.doRequest(InterappMethods.PlayUri, {
      uri: uri,
      feature_identifier: featureIdentifier,
      interaction_id: interactionId,
      skip_to_uri: skipToUri,
      skip_to_uid: skipToUid,
    });
  }

  queueUri(uri: string) {
    return this.doRequest(InterappMethods.QueueUri, { uri });
  }

  skipNext() {
    return this.doRequest(InterappMethods.SkipNext);
  }

  skipPrevious(allowSeeking: boolean) {
    return this.doRequest(InterappMethods.SkipPrev, {
      allow_seeking: allowSeeking,
    });
  }

  answerPhone() {
    return this.doRequest(InterappMethods.PhoneAnswer);
  }

  declinePhone() {
    return this.doRequest(InterappMethods.PhoneDecline);
  }

  getPhoneCallImage(phoneNumber: string) {
    return this.doRequest(InterappMethods.PhoneCallImage, {
      phone_number: phoneNumber,
    });
  }

  sendMessageToPhone(phoneNumber: string, message: string) {
    return this.doRequest(InterappMethods.PhoneCallMessage, {
      phone_number: phoneNumber,
      message: message,
    });
  }

  seekTo(position: number) {
    return this.doRequest(InterappMethods.SeekTo, {
      position: position,
    });
  }

  resume() {
    return this.doRequest(InterappMethods.Resume, {});
  }

  pause() {
    return this.doRequest(InterappMethods.Pause);
  }

  setShuffle(shuffle: boolean) {
    return this.doRequest(InterappMethods.SetShuffle, {
      shuffle: shuffle,
    });
  }

  setRepeat(repeatMode: RepeatMode) {
    return this.doRequest(InterappMethods.SetRepeat, {
      repeat_mode: repeatMode,
    });
  }

  addToQueue(uri: string) {
    return this.doRequest(InterappMethods.QueueUri, { uri: uri });
  }

  /**
   * @deprecated Use `resume` or `pause`
   */
  _setPlaybackSpeed(playbackSpeed: number) {
    return this.doRequest(InterappMethods._SetPlaybackSpeed, {
      playback_speed: playbackSpeed,
    });
  }

  setPodcastPlaybackSpeed(playbackSpeed: number) {
    return this.doRequest(InterappMethods.SetPodcastPlaybackSpeed, {
      playback_speed: playbackSpeed,
    });
  }

  getTips() {
    return this.doRequest(InterappMethods.GetTips, {}, false);
  }

  getOnDemandTips() {
    return this.doGraphQLRequest(getTipsOnDemandQuery, true);
  }

  /**
   * @deprecated Use `getPresets`
   */
  _getPresets() {
    return this.doRequest(InterappMethods.GetPresets, {}, false);
  }

  getPresets(serial: string) {
    return this.doGraphQLRequest(getPresetsQuery(serial), false);
  }

  async doGraphQLRequest(payload: string, userAction: boolean = true) {
    const response = await this.doRequest(
      InterappMethods.Graph,
      {
        payload,
      },
      userAction,
    );

    if (response.errors) {
      throw new InterappError(`GraphQL Error`, InterappMethods.Graph, payload);
    }

    return response.data;
  }

  setPreset(presets: SetPresetRequest): Promise<SetPresetResponse> {
    return this.doRequest(InterappMethods.SetPreset, {
      presets: presets,
    });
  }

  getTts(file: string) {
    return this.doRequest(InterappMethods.GetTts, { file });
  }

  /**
   * @deprecated Use `seekTo`
   */
  _seekToPosition(position: number) {
    return this.doRequest(InterappMethods._SeekToPosition, {
      position_ms: position,
    });
  }

  getSaved(uri: string) {
    return this.doRequest(InterappMethods.GetSaved, { id: uri }, false);
  }

  setSaved(saved: boolean, uri?: string) {
    return this.doRequest(InterappMethods.SetSaved, {
      id: uri,
      uri,
      saved,
    });
  }

  /**
   * @deprecated Use `setShuffle`
   */
  _setShuffle(shuffle: number) {
    return this.doRequest(InterappMethods._SetShuffle, {
      shuffle: !!shuffle,
    });
  }

  /**
   * @deprecated Use `skipNext`
   */
  _skipNext() {
    return this.doRequest(InterappMethods._SkipNext);
  }

  requestLog(logs: Array<RequestLog>) {
    return this.doRequest(InterappMethods.RequestLog, { logs }, false);
  }

  /**
   * @deprecated Use `skipPrevious`
   */
  _skipPrevious() {
    return this.doRequest(InterappMethods._SkipPrevious);
  }

  /**
   * @deprecated Use `skipPrevious`
   */
  _skipPreviousForce() {
    return this.doRequest(InterappMethods._SkipPrevious, {
      force_skip_previous: true,
    });
  }

  skipToIndex(index: number) {
    return this.doRequest(InterappMethods.SkipToIndex, {
      index,
    });
  }

  getImage(id: string) {
    return this.doRequest(InterappMethods.GetImage, { id }, false);
  }

  getThumbnailImage(id: string) {
    return this.doRequest(InterappMethods.GetThumbnailImage, { id }, false);
  }

  getPodcast(uri: string, limit?: number, offset?: number) {
    return this.doRequest(
      InterappMethods.GetPodcast,
      { limit, uri, offset },
      false,
    );
  }

  getChildrenOfItem(parentId: string, limit: number, offset?: number) {
    return this.doRequest(
      InterappMethods.GetChildrenOfItem,
      {
        limit,
        parent_id: parentId,
        offset,
      },
      false,
    );
  }

  getHome(
    limit: number,
    overrides: HomeOverridesRequest,
  ): Promise<HomeResponsePayload> {
    return this.doRequest(
      InterappMethods.GetHome,
      { limit, limit_overrides: overrides },
      false,
    );
  }

  queryHome(
    limit: number,
    overrides: HomeGraphOverridesReq[],
  ): Promise<GraphHomeResponsePayload> {
    return this.doGraphQLRequest(getShelfQuery(limit, overrides), false);
  }

  queryHomeMore(
    id: string,
    limit: number,
    offset: number,
  ): Promise<GraphHomeMoreResponsePayload> {
    return this.doGraphQLRequest(
      getShelfSectionQuery(id, limit, offset),
      false,
    );
  }

  /**
   * @deprecated Use `playUri`
   */
  _playItem(id: string, featureIdentifier: string) {
    return this.doRequest(InterappMethods._PlayItem, {
      id: id,
      feature_identifier: featureIdentifier,
    });
  }

  /**
   * @deprecated Use `playUri`
   */
  _playUriFromContext(
    contextUri: string,
    uri: string,
    featureIdentifier: string,
  ) {
    return this.doRequest(InterappMethods._PlayUri, {
      uri: contextUri,
      contextURI: contextUri,
      skipToURI: uri,
      feature_identifier: featureIdentifier,
    });
  }

  playPodcastTrailer(showUri: string) {
    // todo: feature_identifier, when supported on mobile.
    return this.doRequest(InterappMethods.PlayPodcastTrailer, { uri: showUri });
  }

  getNextTracks() {
    return this.doRequest(InterappMethods.GetNextTracks, {}, false);
  }

  getRecentlyPlayed() {
    return this.doRequest(
      InterappMethods.GetChildrenOfItem,
      {
        limit: 20,
        parent_id: 'spotify:recently-played',
      },
      false,
    );
  }

  getPermissions(): Promise<PermissionStatusResponse> {
    return this.doRequest(InterappMethods.GetPermissions, {}, false);
  }

  earcon(earcon: Earcon) {
    return this.doRequest(InterappMethods.Earcon, { earcon }, false);
  }

  increaseVolume() {
    return this.doRequest(InterappMethods.IncreaseVolume, {}, true);
  }

  decreaseVolume() {
    return this.doRequest(InterappMethods.DecreaseVolume, {}, true);
  }

  sendUbiInteraction(event: UbiProd1InteractionEvent) {
    return this.doRequest(InterappMethods.SendUbiInteraction, event.data);
  }

  sendUbiImpression(event: UbiProd1ImpressionEvent) {
    return this.doRequest(InterappMethods.SendUbiImpression, event.data, false);
  }

  sendUbiBatch(
    interactions: Array<UbiInteraction>,
    impressions: Array<UbiImpression>,
  ) {
    return this.doRequest(
      InterappMethods.SendUbiBatch,
      {
        interactions: interactions.map((i) => i.event.data),
        impressions: impressions.map((i) => i.event.data),
        interaction_timestamps: interactions.map((i) => {
          return {
            timestamp: i.timestamp,
            interaction_id: i.event.data.interaction_id || '',
          };
        }),
        impression_timestamps: impressions.map((i) => {
          return {
            timestamp: i.timestamp,
            impression_id: i.event.data.impression_id || '',
          };
        }),
      },
      false,
    );
  }

  pitstopLog(event: PitstopLogEvent) {
    return this.middlewareRequest
      .request(
        InterappMethods.PitstopLog,
        {
          logs: [event],
        },
        false,
      )
      .catch(() => {});
  }

  /*crashReport(
    serial: string,
    appVersion: string,
    osVersion: string,
    payload: IBacktraceData,
  ) {
    return this.middlewareRequest
      .request(
        InterappMethods.CrashReport,
        {
          serial,
          version_software: appVersion,
          version_os: osVersion,
          json: payload,
        },
        false,
      )
      .catch(() => {});
  }*/
}

export default InterappActions;

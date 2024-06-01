import {
  UbiProd1ImpressionEvent,
  createUbiProd1Impression,
  UbiProd1ImpressionEventData,
} from '@spotify-internal/event-definitions/src/events/createUbiProd1Impression';
import {
  UbiExpr5ImpressionNonAuthEvent,
  createUbiExpr5ImpressionNonAuth,
  UbiExpr5ImpressionNonAuthEventData,
} from '@spotify-internal/event-definitions/src/events/createUbiExpr5ImpressionNonAuth';
import { UBIImpressionEvent } from '@spotify-internal/ubi-types-js';
import {
  getParentPath,
  getParentSpecModes,
  getParentSpecVersions,
  getPathProps,
} from '../utils/EventUtils';
import { EMPTY_STRING } from '../constants';

export const ImpressionEventConverter = (function impressionFn() {
  function createGabitoEvent(
    event: UBIImpressionEvent,
    impressionId: string,
    pageInstanceId: string | null,
    playbackId: string | null,
    playContextUri: string | null,
    authenticated: boolean,
  ): UbiProd1ImpressionEvent | UbiExpr5ImpressionNonAuthEvent {
    const pathProps = getPathProps(event.location.pathNodes);
    const parentPath = getParentPath(event.parentAbsoluteLocation);
    const parentPathProps = getPathProps(parentPath);
    const parentSpecVersions = getParentSpecVersions(
      event.parentAbsoluteLocation,
    );
    const parentSpecModes = getParentSpecModes(event.parentAbsoluteLocation);

    const baseEvent: UbiExpr5ImpressionNonAuthEventData = {
      annotator_configuration_version: EMPTY_STRING,
      annotator_version: EMPTY_STRING,
      app: event.app,
      element_path_ids: pathProps.element_path_ids,
      element_path_names: pathProps.element_path_names,
      element_path_pos: pathProps.element_path_pos,
      element_path_reasons: pathProps.element_path_reasons,
      element_path_uris: pathProps.element_path_uris,
      generator_version: event.generatorVersion,
      impression_id: impressionId,
      parent_modes: parentSpecModes,
      parent_path_ids: parentPathProps.element_path_ids,
      parent_path_names: parentPathProps.element_path_names,
      parent_path_pos: parentPathProps.element_path_pos,
      parent_path_reasons: parentPathProps.element_path_reasons,
      parent_path_uris: parentPathProps.element_path_uris,
      parent_specification_versions: parentSpecVersions,
      specification_version: event.specificationVersion,
      specification_mode: event.specificationMode,
      page_instance_id: pageInstanceId,
      playback_id: playbackId,
    };

    if (authenticated) {
      const authEvent: UbiProd1ImpressionEventData = {
        ...baseEvent,
        play_context_uri: playContextUri,
      };
      return createUbiProd1Impression(authEvent);
    }
    return createUbiExpr5ImpressionNonAuth(baseEvent);
  }

  return { createGabitoEvent };
})();

import { createUbiProd1Interaction, } from '@spotify-internal/event-definitions/src/events/createUbiProd1Interaction';
import { createUbiExpr6InteractionNonAuth, } from '@spotify-internal/event-definitions/src/events/createUbiExpr6InteractionNonAuth';
import { getParentPath, getParentSpecModes, getParentSpecVersions, getPathProps, } from '../utils/EventUtils';
import { EMPTY_STRING } from '../constants';
export const InteractionEventConverter = (function interactionFn() {
    function createGabitoEvent(event, interactionId, pageInstanceId, playbackId, playContextUri, authenticated) {
        const pathProps = getPathProps(event.location.pathNodes);
        const parentPath = getParentPath(event.parentAbsoluteLocation);
        const parentPathProps = getPathProps(parentPath);
        const parentSpecVersions = getParentSpecVersions(event.parentAbsoluteLocation);
        const parentSpecModes = getParentSpecModes(event.parentAbsoluteLocation);
        const baseEvent = {
            action_parameter_names: event.actionParameterNames,
            action_parameter_values: event.actionParameterValues,
            action_name: event.actionName,
            action_version: event.actionVersion,
            annotator_configuration_version: EMPTY_STRING,
            annotator_version: EMPTY_STRING,
            app: event.app,
            element_path_ids: pathProps.element_path_ids,
            element_path_names: pathProps.element_path_names,
            element_path_pos: pathProps.element_path_pos,
            element_path_reasons: pathProps.element_path_reasons,
            element_path_uris: pathProps.element_path_uris,
            generator_version: event.generatorVersion,
            interaction_id: interactionId,
            interaction_type: event.interactionType,
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
            const authEvent = {
                ...baseEvent,
                play_context_uri: playContextUri,
            };
            return createUbiProd1Interaction(authEvent);
        }
        return createUbiExpr6InteractionNonAuth(baseEvent);
    }
    return { createGabitoEvent };
})();

// NOTE: This code was generated and should not be changed

/**
 * An event emitted when the user interacts with an element
 */
export type UbiProd1InteractionEventData = {
  /**
   * The version of the generators lib used to generate this instrumentation's code
   */
  generator_version?: string | null;
  /**
   * The client app (e.g, "music", "stations")
   */
  app?: string | null;
  /**
   * The interaction type (e.g., "hit")
   */
  interaction_type?: string | null;
  /**
   * The action name (e.g., "play")
   */
  action_name?: string | null;
  /**
   * The version of the action
   */
  action_version?: number | null;
  /**
   * The names of the parameters for the actions (e.g. the action "play" may have a parameter named "track" which identifies what was played).
   */
  action_parameter_names?: string[] | null;
  /**
   * The values of the parameters for the actions (e.g. the action "play" may have a parameter named "track" - this field contains the actual track value).
   */
  action_parameter_values?: string[] | null;
  /**
   * Each instrumented item on a page has description of where it is located on the screen (e.g. "topbar" -> "back button")
   */
  element_path_names?: string[] | null;
  /**
   * Describes the position of an item in the case where there are several equivalent items in a pattern (i.e. tracks in a list)
   */
  element_path_pos?: string[] | null;
  /**
   * Contains an idendtifier associated with the item
   */
  element_path_ids?: string[] | null;
  /**
   * Conatins an uri associated with the item (e.g. a track uri in case of the item being a track)
   */
  element_path_uris?: string[] | null;
  /**
   * Contains a reason for the item being on the page
   */
  element_path_reasons?: string[] | null;
  /**
   * Any errors occured when the event happened or when the event was built, etc. It can contain errors from parents if composition is used.
   */
  errors?: string[] | null;
  /**
   * A UUID identifying the event
   */
  interaction_id?: string | null;
  /**
   * Unique id per PageView event, identifying the specific instance of the current page view.
   */
  page_instance_id?: string | null;
  /**
   * The semantic version of the specification
   */
  specification_version?: string | null;
  /**
   * The mode used by this event for the specification, e.g. "online" vs. "offline" where the modes have many elements in common but some differences depending on the mode
   */
  specification_mode?: string | null;
  /**
   * An unique identifier for the playback of the active track or null if there is no active track
   */
  playback_id?: string | null;
  /**
   * The unique id for the impression given by the client for the same element for this interaction
   */
  impression_id?: string | null;
  /**
   * The version of the Hubs UBI annotator used to generate this Hubs UBI logging data, or null if Hubs UBI annotator is not used
   */
  annotator_version?: string | null;
  /**
   * The version of the configration used by Hubs UBI annotator to generate this Hubs UBI logging data, or null if Hubs UBI annotator is not used
   */
  annotator_configuration_version?: string | null;
  /**
   * The parents' path names when composition is used, or empty if composition is not used. The order of the array elements follows the composition hierarchy, e.g. the last element in the array is from the direct parent.
   */
  parent_path_names?: string[] | null;
  /**
   * The parents' path positions when composition is used, or empty if composition is not used. The order of the array elements follows the composition hierarchy, e.g. the last element in the array is from the direct parent.
   */
  parent_path_pos?: string[] | null;
  /**
   * The parents' path ids when composition is used, or empty if composition is not used. The order of the array elements follows the composition hierarchy, e.g. the last element in the array is from the direct parent.
   */
  parent_path_ids?: string[] | null;
  /**
   * The parents' path uris when composition is used, or empty if composition is not used. The order of the array elements follows the composition hierarchy, e.g. the last element in the array is from the direct parent.
   */
  parent_path_uris?: string[] | null;
  /**
   * The parents' path reasons when composition is used, or empty if composition is not used. The order of the array elements follows the composition hierarchy, e.g. the last element in the array is from the direct parent.
   */
  parent_path_reasons?: string[] | null;
  /**
   * The parents' specification versions when composition is used, or empty if composition is not used. The order of the array elements follows the composition hierarchy, e.g. the last element in the array is from the direct parent.
   */
  parent_specification_versions?: string[] | null;
  /**
   * The parents' specification modes when composition is used, or empty if composition is not used. The order of the array elements follows the composition hierarchy, e.g. the last element in the array is from the direct parent.
   */
  parent_modes?: string[] | null;
  /**
   * Identifies the location of the current page.
   */
  page_uri?: string | null;
  /**
   * Identifies the context of the current track.
   */
  play_context_uri?: string | null;
};

export type UbiProd1InteractionEvent = {
  name: 'UbiProd1Interaction';
  environments: ['device', 'browser', 'desktop'];
  data: UbiProd1InteractionEventData;
};

/**
 * A builder for UbiProd1Interaction
 *
 * @param data - The event data
 * @return The formatted event data for UbiProd1InteractionEvent
 */
export function createUbiProd1Interaction(
  data: UbiProd1InteractionEventData
): UbiProd1InteractionEvent {
  return {
    name: 'UbiProd1Interaction',
    environments: ['device', 'browser', 'desktop'],
    data,
  };
}

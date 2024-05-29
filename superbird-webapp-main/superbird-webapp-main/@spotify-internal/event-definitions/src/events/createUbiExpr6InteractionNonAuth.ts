// NOTE: This code was generated and should not be changed

/**
 * An interaction from an unauthenticated user
 */
export type UbiExpr6InteractionNonAuthEventData = {
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
  action_parameter_names?: string[] | null;
  action_parameter_values?: string[] | null;
  element_path_names?: string[] | null;
  element_path_pos?: string[] | null;
  element_path_ids?: string[] | null;
  element_path_uris?: string[] | null;
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
};

export type UbiExpr6InteractionNonAuthEvent = {
  name: 'UbiExpr6InteractionNonAuth';
  environments: ['devicenonauth', 'browsernonauth', 'desktopnonauth'];
  data: UbiExpr6InteractionNonAuthEventData;
};

/**
 * A builder for UbiExpr6InteractionNonAuth
 *
 * @param data - The event data
 * @return The formatted event data for UbiExpr6InteractionNonAuthEvent
 */
export function createUbiExpr6InteractionNonAuth(
  data: UbiExpr6InteractionNonAuthEventData
): UbiExpr6InteractionNonAuthEvent {
  return {
    name: 'UbiExpr6InteractionNonAuth',
    environments: ['devicenonauth', 'browsernonauth', 'desktopnonauth'],
    data,
  };
}

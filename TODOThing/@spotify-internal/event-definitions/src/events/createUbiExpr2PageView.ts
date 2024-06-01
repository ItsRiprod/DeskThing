// NOTE: This code was generated and should not be changed

/**
 * A user completed a UI navigation from one page to another page
 */
export type UbiExpr2PageViewEventData = {
  /**
   * Unique id per PageView event, identifying the specific instance of the destination page view.
   */
  page_instance_id?: string | null;
  /**
   * Page identifier of the navigation destination. Empty value is used for background.
   */
  page_id?: string | null;
  /**
   * If the page that the navigation ended at is showing a Spotify entity like an album or a playlist, then this will be the Spotify URI of that entity. Empty value is used for background.
   */
  entity_uri?: string | null;
  /**
   * The root identifier for the destination page, such as "startpage" or "collection". Empty value is used for background.
   */
  navigational_root?: string | null;
  /**
   * Unique id per PageView event, identifying the specific instance of the previous page view.
   */
  from_page_instance_id?: string | null;
  /**
   * Page identifier of the previous page of the navigation. Empty value is used for background.
   */
  from_page_id?: string | null;
  /**
   * If the page from where the navigation started from was showing a Spotify entity like an album or a playlist, then this will be the Spotify URI of that entity. Empty value is used for background.
   */
  from_entity_uri?: string | null;
  /**
   * The root identifier for the previous page, such as "startpage" or "collection". Empty value is used for background.
   */
  from_navigational_root?: string | null;
  /**
   * The reason that triggered the navigation. Available types are UserInteraction, Back, Launcher, DeepLink and Unknown.
   */
  navigation_reason?: string | null;
  /**
   * UUIDs identifying last three interaction events observed prior to the navigation, sorted by oldest to newest.
   */
  previous_interaction_ids?: string[] | null;
  /**
   * Instrumentation errors.
   */
  errors?: string[] | null;
};

export type UbiExpr2PageViewEvent = {
  name: 'UbiExpr2PageView';
  environments: ['device', 'browser', 'desktop'];
  data: UbiExpr2PageViewEventData;
};

/**
 * A builder for UbiExpr2PageView
 *
 * @param data - The event data
 * @return The formatted event data for UbiExpr2PageViewEvent
 */
export function createUbiExpr2PageView(
  data: UbiExpr2PageViewEventData
): UbiExpr2PageViewEvent {
  return {
    name: 'UbiExpr2PageView',
    environments: ['device', 'browser', 'desktop'],
    data,
  };
}

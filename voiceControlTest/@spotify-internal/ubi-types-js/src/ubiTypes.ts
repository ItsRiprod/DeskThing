export type PathNode = {
  name: string;
  identifier?: string;
  uri?: string;
  position?: number;
  reason?: string;
};

export type Location = {
  pathNodes: PathNode[];
  specVersion: string[];
  specMode: string[];
};

export type EventAbsoluteLocation = {
  locations: Location[];
};

export interface UBIEvent {
  location: Location;
  parentAbsoluteLocation?: EventAbsoluteLocation;
  app: string;
  specificationVersion: string;
  specificationMode: string;
  annotatorConfigurationVersion: string;
  annotatorVersion: string;
  generatorVersion: string;
}

export interface UBIImpressionEvent extends UBIEvent {}

export interface UBIInteractionEvent extends UBIEvent {
  interactionType: string;
  actionParameterNames?: string[];
  actionParameterValues?: string[];
  actionName: string;
  actionVersion: number;
}

export type PathProps = {
  element_path_names: string[];
  element_path_pos: number[];
  element_path_ids: string[];
  element_path_uris: string[];
  element_path_reasons: string[];
};

export enum NavigationReason {
  CLIENT_LOST_FOCUS = 'client_lost_focus',
  CLIENT_GAINED_FOCUS = 'client_gained_focus',
  CLIENT_STARTED = 'client_started',
  DEEP_LINK = 'deep_link',
  BACK = 'back',
  FORWARD = 'forward',
  UNKNOWN = 'unknown',
}

export type NavigationStartInfoByInteraction = {
  navigationalRoot: string;
  interactionId: string;
};

export type NavigationStartInfoByReason = {
  navigationalRoot: string;
  navigationReason: NavigationReason;
};

export type NavigationStartInfo =
  | NavigationStartInfoByInteraction
  | NavigationStartInfoByReason;

export type NavigationEndInfo = {
  pageId: string;
  entityUri: string;
};

export type NavigateInteractionInfo = {
  entityUri?: string | null;
  navigationReason?: NavigationReason | null;
};

export type NavigationInfo = {
  entityUri: string | null;
  pageId: string | null;
  navigationReason?: NavigationReason | null;
  navigationalRoot: string | null;
};

export function isNavigationByInteraction(
  navigationStartInfo: NavigationStartInfo,
): navigationStartInfo is NavigationStartInfoByInteraction {
  return 'interactionId' in navigationStartInfo;
}

export function isNavigationByReason(
  navigationStartInfo: NavigationStartInfo,
): navigationStartInfo is NavigationStartInfoByReason {
  return 'navigationReason' in navigationStartInfo;
}

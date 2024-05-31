import {
  EventAbsoluteLocation,
  PathNode,
} from '@spotify-internal/ubi-types-js';
import { EMPTY_STRING } from '../constants';

function flatten(pathNodes: (PathNode | string)[][]) {
  return pathNodes.reduce((acc, val) => acc.concat(val), []);
}

type GabitoPathProps = {
  element_path_names: string[];
  element_path_pos: string[];
  element_path_ids: string[];
  element_path_uris: string[];
  element_path_reasons: string[];
};

export function getPathProps(path: PathNode[]): GabitoPathProps {
  const pathProps: GabitoPathProps = {
    element_path_names: [],
    element_path_pos: [],
    element_path_ids: [],
    element_path_uris: [],
    element_path_reasons: [],
  };

  for (const pathNode of path) {
    pathProps.element_path_names.push(pathNode.name);
    pathProps.element_path_pos.push(
      pathNode.position?.toString() || EMPTY_STRING,
    );
    pathProps.element_path_ids.push(pathNode.identifier || EMPTY_STRING);
    pathProps.element_path_uris.push(pathNode.uri || EMPTY_STRING);
    pathProps.element_path_reasons.push(pathNode.reason || EMPTY_STRING);
  }

  return pathProps;
}

export function getParentPath(
  parentAbsoluteLocation: EventAbsoluteLocation | undefined,
): PathNode[] {
  return parentAbsoluteLocation
    ? (flatten(
        parentAbsoluteLocation.locations.map(location => location.pathNodes),
      ) as PathNode[])
    : [];
}

export function getParentSpecVersions(
  parentAbsoluteLocation: EventAbsoluteLocation | undefined,
): string[] {
  return parentAbsoluteLocation
    ? (flatten(
        parentAbsoluteLocation.locations.map(location => location.specVersion),
      ) as string[])
    : [];
}

export function getParentSpecModes(
  parentAbsoluteLocation: EventAbsoluteLocation | undefined,
): string[] {
  return parentAbsoluteLocation
    ? (flatten(
        parentAbsoluteLocation.locations.map(location => location.specMode),
      ) as string[])
    : [];
}

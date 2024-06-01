import { EMPTY_STRING } from '../constants';
function flatten(pathNodes) {
    return pathNodes.reduce((acc, val) => acc.concat(val), []);
}
export function getPathProps(path) {
    const pathProps = {
        element_path_names: [],
        element_path_pos: [],
        element_path_ids: [],
        element_path_uris: [],
        element_path_reasons: [],
    };
    for (const pathNode of path) {
        pathProps.element_path_names.push(pathNode.name);
        pathProps.element_path_pos.push(pathNode.position?.toString() || EMPTY_STRING);
        pathProps.element_path_ids.push(pathNode.identifier || EMPTY_STRING);
        pathProps.element_path_uris.push(pathNode.uri || EMPTY_STRING);
        pathProps.element_path_reasons.push(pathNode.reason || EMPTY_STRING);
    }
    return pathProps;
}
export function getParentPath(parentAbsoluteLocation) {
    return parentAbsoluteLocation
        ? flatten(parentAbsoluteLocation.locations.map(location => location.pathNodes))
        : [];
}
export function getParentSpecVersions(parentAbsoluteLocation) {
    return parentAbsoluteLocation
        ? flatten(parentAbsoluteLocation.locations.map(location => location.specVersion))
        : [];
}
export function getParentSpecModes(parentAbsoluteLocation) {
    return parentAbsoluteLocation
        ? flatten(parentAbsoluteLocation.locations.map(location => location.specMode))
        : [];
}

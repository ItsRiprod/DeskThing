export var NavigationReason;
(function (NavigationReason) {
    NavigationReason["CLIENT_LOST_FOCUS"] = "client_lost_focus";
    NavigationReason["CLIENT_GAINED_FOCUS"] = "client_gained_focus";
    NavigationReason["CLIENT_STARTED"] = "client_started";
    NavigationReason["DEEP_LINK"] = "deep_link";
    NavigationReason["BACK"] = "back";
    NavigationReason["FORWARD"] = "forward";
    NavigationReason["UNKNOWN"] = "unknown";
})(NavigationReason || (NavigationReason = {}));
export function isNavigationByInteraction(navigationStartInfo) {
    return 'interactionId' in navigationStartInfo;
}
export function isNavigationByReason(navigationStartInfo) {
    return 'navigationReason' in navigationStartInfo;
}

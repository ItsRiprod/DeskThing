import { createUbiExpr2PageView } from '@spotify-internal/event-definitions/src/events/createUbiExpr2PageView';
import { v4 as uuidv4 } from 'uuid';
import { NavigationReason, } from '@spotify-internal/ubi-types-js';
import { isNavigationByInteraction, isNavigationByReason, } from '@spotify-internal/ubi-types-js';
export var NavigationEvents;
(function (NavigationEvents) {
    NavigationEvents["NAVIGATION_IDLE"] = "navigation_idle";
    NavigationEvents["NAVIGATION_STARTED"] = "navigation_started";
    NavigationEvents["NAVIGATION_COMPLETED"] = "navigation_completed";
})(NavigationEvents || (NavigationEvents = {}));
export class PageViewLogger {
    currentPageId = null;
    currentPageInstanceId = null;
    currentEntityUri = null;
    currentNavigationalRoot = null;
    navigationStatus = null;
    pendingNavigationalRoot = null;
    pendingInteractionId = null;
    pendingNavigationReason = null;
    eventSender;
    pageInstanceIdProvider;
    disableAutoBackgroundMonitoring;
    constructor(options) {
        this.eventSender = options.eventSender;
        this.pageInstanceIdProvider = options.pageInstanceIdProvider;
        this.disableAutoBackgroundMonitoring =
            options.disableAutoBackgroundMonitoring;
        this.navigationStatus = NavigationEvents.NAVIGATION_IDLE;
        this.handleBackgroundStates = this.handleBackgroundStates.bind(this);
    }
    resetNavStartInfo() {
        this.pendingInteractionId = null;
        this.pendingNavigationReason = null;
        this.pendingNavigationalRoot = null;
    }
    populateNavigationReason() {
        if (this.pendingInteractionId) {
            return `user_interaction(${this.pendingInteractionId})`;
        }
        return this.pendingNavigationReason;
    }
    generatePageInstanceId() {
        const uuid = uuidv4();
        this.pageInstanceIdProvider.setPageInstanceId(uuid);
        return uuid;
    }
    setCurrent(pageId, pageInstanceId, entityUri, navigationalRoot) {
        this.currentPageId = pageId;
        this.currentPageInstanceId = pageInstanceId;
        this.currentEntityUri = entityUri;
        this.currentNavigationalRoot = navigationalRoot;
    }
    handleBackgroundStates() {
        if (document.hidden) {
            this.logClientLostFocus();
        }
        else {
            this.logClientGainedFocus();
        }
    }
    startNavigation(navigationInfo) {
        const { navigationalRoot } = navigationInfo;
        if (isNavigationByInteraction(navigationInfo)) {
            const { interactionId } = navigationInfo;
            this.pendingInteractionId = interactionId;
        }
        if (isNavigationByReason(navigationInfo)) {
            const { navigationReason } = navigationInfo;
            this.pendingNavigationReason = navigationReason;
        }
        this.pendingNavigationalRoot = navigationalRoot;
        this.navigationStatus = NavigationEvents.NAVIGATION_STARTED;
    }
    completeNavigation(navigationInfo) {
        const { pageId, entityUri } = navigationInfo;
        if (this.currentEntityUri !== entityUri &&
            this.navigationStatus === NavigationEvents.NAVIGATION_STARTED) {
            const pageInstanceId = this.generatePageInstanceId();
            const data = {
                page_instance_id: pageInstanceId,
                page_id: pageId,
                entity_uri: entityUri,
                navigational_root: this.pendingNavigationalRoot,
                from_page_instance_id: this.currentPageInstanceId,
                from_page_id: this.currentPageId,
                from_entity_uri: this.currentEntityUri,
                from_navigational_root: this.currentNavigationalRoot,
                navigation_reason: this.populateNavigationReason(),
            };
            const event = createUbiExpr2PageView(data);
            this.eventSender.send(event);
            this.setCurrent(pageId, pageInstanceId, entityUri, this.pendingNavigationalRoot);
        }
        else {
            // dont send page view event
            this.resetNavStartInfo();
        }
        this.navigationStatus = NavigationEvents.NAVIGATION_IDLE;
    }
    logClientLostFocus() {
        const pageInstanceId = this.generatePageInstanceId();
        const data = {
            page_instance_id: pageInstanceId,
            page_id: null,
            entity_uri: null,
            navigational_root: null,
            from_page_instance_id: this.currentPageInstanceId,
            from_page_id: this.currentPageId,
            from_entity_uri: this.currentEntityUri,
            from_navigational_root: this.currentNavigationalRoot,
            navigation_reason: NavigationReason.CLIENT_LOST_FOCUS,
        };
        const event = createUbiExpr2PageView(data);
        this.eventSender.send(event);
        this.setCurrent(this.currentPageId, pageInstanceId, this.currentEntityUri, this.currentNavigationalRoot);
    }
    logClientGainedFocus() {
        const pageInstanceId = this.generatePageInstanceId();
        const data = {
            page_instance_id: pageInstanceId,
            page_id: this.currentPageId,
            entity_uri: this.currentEntityUri,
            navigational_root: this.currentNavigationalRoot,
            from_page_instance_id: this.currentPageInstanceId,
            from_page_id: null,
            from_entity_uri: null,
            from_navigational_root: null,
            navigation_reason: NavigationReason.CLIENT_GAINED_FOCUS,
        };
        const event = createUbiExpr2PageView(data);
        this.eventSender.send(event);
        this.setCurrent(this.currentPageId, pageInstanceId, this.currentEntityUri, this.currentNavigationalRoot);
    }
    addEventListeners() {
        if (!this.disableAutoBackgroundMonitoring) {
            document?.addEventListener('visibilitychange', this.handleBackgroundStates);
        }
    }
    removeEventListeners() {
        if (!this.disableAutoBackgroundMonitoring) {
            document?.removeEventListener('visibilitychange', this.handleBackgroundStates);
        }
    }
}

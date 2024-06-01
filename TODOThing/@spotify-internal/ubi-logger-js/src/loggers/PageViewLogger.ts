import { createUbiExpr2PageView } from '@spotify-internal/event-definitions/src/events/createUbiExpr2PageView';
import { v4 as uuidv4 } from 'uuid';
import {
  NavigationEndInfo,
  NavigationReason,
  NavigationStartInfo,
} from '@spotify-internal/ubi-types-js';
import { EventSender } from './UBILogger';
import { PageInstanceIdProvider } from '../providers/PageInstanceIdProvider';
import {
  isNavigationByInteraction,
  isNavigationByReason,
} from '@spotify-internal/ubi-types-js';

export enum NavigationEvents {
  NAVIGATION_IDLE = 'navigation_idle',
  NAVIGATION_STARTED = 'navigation_started',
  NAVIGATION_COMPLETED = 'navigation_completed',
}

export type PageTransitionLoggerOptions = {
  eventSender: EventSender;
  pageInstanceIdProvider: PageInstanceIdProvider;
  disableAutoBackgroundMonitoring: boolean;
};

export class PageViewLogger {
  private currentPageId: string | null = null;
  private currentPageInstanceId: string | null = null;
  private currentEntityUri: string | null = null;
  private currentNavigationalRoot: string | null = null;
  private navigationStatus: NavigationEvents | null = null;
  private pendingNavigationalRoot: string | null = null;
  private pendingInteractionId: string | null = null;
  private pendingNavigationReason: NavigationReason | null = null;
  private eventSender: EventSender;

  private pageInstanceIdProvider: PageInstanceIdProvider;
  private disableAutoBackgroundMonitoring: boolean;

  constructor(options: PageTransitionLoggerOptions) {
    this.eventSender = options.eventSender;
    this.pageInstanceIdProvider = options.pageInstanceIdProvider;
    this.disableAutoBackgroundMonitoring =
      options.disableAutoBackgroundMonitoring;
    this.navigationStatus = NavigationEvents.NAVIGATION_IDLE;
    this.handleBackgroundStates = this.handleBackgroundStates.bind(this);
  }

  private resetNavStartInfo(): void {
    this.pendingInteractionId = null;
    this.pendingNavigationReason = null;
    this.pendingNavigationalRoot = null;
  }

  private populateNavigationReason(): NavigationReason | string | null {
    if (this.pendingInteractionId) {
      return `user_interaction(${this.pendingInteractionId})`;
    }
    return this.pendingNavigationReason;
  }

  private generatePageInstanceId(): string {
    const uuid = uuidv4();
    this.pageInstanceIdProvider.setPageInstanceId(uuid);
    return uuid;
  }

  private setCurrent(
    pageId: string | null,
    pageInstanceId: string | null,
    entityUri: string | null,
    navigationalRoot: string | null,
  ): void {
    this.currentPageId = pageId;
    this.currentPageInstanceId = pageInstanceId;
    this.currentEntityUri = entityUri;
    this.currentNavigationalRoot = navigationalRoot;
  }

  private handleBackgroundStates(): void {
    if (document.hidden) {
      this.logClientLostFocus();
    } else {
      this.logClientGainedFocus();
    }
  }

  startNavigation(navigationInfo: NavigationStartInfo): void {
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

  completeNavigation(navigationInfo: NavigationEndInfo): void {
    const { pageId, entityUri } = navigationInfo;
    if (
      this.currentEntityUri !== entityUri &&
      this.navigationStatus === NavigationEvents.NAVIGATION_STARTED
    ) {
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
      this.setCurrent(
        pageId,
        pageInstanceId,
        entityUri,
        this.pendingNavigationalRoot,
      );
    } else {
      // dont send page view event
      this.resetNavStartInfo();
    }

    this.navigationStatus = NavigationEvents.NAVIGATION_IDLE;
  }

  logClientLostFocus(): void {
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
    this.setCurrent(
      this.currentPageId,
      pageInstanceId,
      this.currentEntityUri,
      this.currentNavigationalRoot,
    );
  }

  logClientGainedFocus(): void {
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
    this.setCurrent(
      this.currentPageId,
      pageInstanceId,
      this.currentEntityUri,
      this.currentNavigationalRoot,
    );
  }

  addEventListeners(): void {
    if (!this.disableAutoBackgroundMonitoring) {
      document?.addEventListener(
        'visibilitychange',
        this.handleBackgroundStates,
      );
    }
  }

  removeEventListeners(): void {
    if (!this.disableAutoBackgroundMonitoring) {
      document?.removeEventListener(
        'visibilitychange',
        this.handleBackgroundStates,
      );
    }
  }
}

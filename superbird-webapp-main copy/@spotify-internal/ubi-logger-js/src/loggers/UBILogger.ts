import { ImpressionEventConverter } from '../eventConverters/ImpressionEventConverter';
import { InteractionEventConverter } from '../eventConverters/InteractionEventConverter';
// import { PageTransitionLogger } from './PageTransitionLogger';
import {
  NavigationEndInfo,
  NavigationStartInfo,
  UBIImpressionEvent,
  UBIInteractionEvent,
} from '@spotify-internal/ubi-types-js';
import { UbiProd1InteractionEvent } from '@spotify-internal/event-definitions/src/events/createUbiProd1Interaction';
import { UbiExpr6InteractionNonAuthEvent } from '@spotify-internal/event-definitions/src/events/createUbiExpr6InteractionNonAuth';
import { UbiProd1ImpressionEvent } from '@spotify-internal/event-definitions/src/events/createUbiProd1Impression';
import { UbiExpr5ImpressionNonAuthEvent } from '@spotify-internal/event-definitions/src/events/createUbiExpr5ImpressionNonAuth';
import { UbiExpr2PageViewEvent } from '@spotify-internal/event-definitions/src/events/createUbiExpr2PageView';
import { v4 as uuid } from 'uuid';
import {
  PageInstanceIdProvider,
  UBIPageInstanceIdProvider,
} from '../providers/PageInstanceIdProvider';
import { PlayContextUriProvider } from '../providers/PlayContextUriProvider';
import { PlaybackIdProvider } from '../providers/PlaybackIdProvider';
import { PageViewLogger } from './PageViewLogger';

export type EventSenderOptions = {
  flush: boolean;
};

export interface EventSender {
  send(
    event:
      | UbiProd1InteractionEvent
      | UbiExpr6InteractionNonAuthEvent
      | UbiProd1ImpressionEvent
      | UbiExpr5ImpressionNonAuthEvent
      | UbiExpr2PageViewEvent,
    eventSenderOptions?: EventSenderOptions,
  ): void;
}

export type UBILoggerOptions = {
  eventSender: EventSender;
  disableAutoBackgroundMonitoring?: boolean;
  playContextUriProvider?: PlayContextUriProvider;
  playbackIdProvider?: PlaybackIdProvider;
};

export class UBILogger {
  private pageInstanceIdProvider: PageInstanceIdProvider;
  private playContextUriProvider: PlayContextUriProvider | null;
  private playbackIdProvider: PlaybackIdProvider | null;

  private pageViewLogger: PageViewLogger;
  private eventSender: EventSender;
  private disableAutoBackgroundMonitoring: boolean;

  constructor(options: UBILoggerOptions) {
    this.eventSender = options.eventSender;
    this.disableAutoBackgroundMonitoring =
      options.disableAutoBackgroundMonitoring ?? true;
    this.pageInstanceIdProvider = new UBIPageInstanceIdProvider();
    this.playContextUriProvider = options.playContextUriProvider ?? null;
    this.playbackIdProvider = options.playbackIdProvider ?? null;

    this.pageViewLogger = new PageViewLogger({
      eventSender: options.eventSender,
      pageInstanceIdProvider: this.pageInstanceIdProvider,
      disableAutoBackgroundMonitoring: this.disableAutoBackgroundMonitoring,
    });
  }

  registerEventListeners(): void {
    this.pageViewLogger.addEventListeners();
  }

  unregisterEventListeners(): void {
    this.pageViewLogger.removeEventListeners();
  }

  logInteraction(event: UBIInteractionEvent): string {
    const interactionId = uuid();
    const pageInstanceId = this.pageInstanceIdProvider.getPageInstanceId();
    const gabitoEvent = InteractionEventConverter.createGabitoEvent(
      event,
      interactionId,
      pageInstanceId,
      this.playbackIdProvider?.getPlaybackId() ?? null,
      this.playContextUriProvider?.getPlayContextUri() ?? null,
      true,
    ) as UbiProd1InteractionEvent;
    this.eventSender.send(gabitoEvent);
    return interactionId;
  }

  logNonAuthInteraction(event: UBIInteractionEvent): string {
    const interactionId = uuid();
    const gabitoEvent = InteractionEventConverter.createGabitoEvent(
      event,
      interactionId,
      this.pageInstanceIdProvider.getPageInstanceId(),
      this.playbackIdProvider?.getPlaybackId() ?? null,
      this.playContextUriProvider?.getPlayContextUri() ?? null,
      false,
    ) as UbiExpr6InteractionNonAuthEvent;
    this.eventSender.send(gabitoEvent);
    return interactionId;
  }

  logImpression(event: UBIImpressionEvent): string {
    const impressionId = uuid();
    const gabitoEvent = ImpressionEventConverter.createGabitoEvent(
      event,
      impressionId,
      this.pageInstanceIdProvider.getPageInstanceId(),
      this.playbackIdProvider?.getPlaybackId() ?? null,
      this.playContextUriProvider?.getPlayContextUri() ?? null,
      true,
    ) as UbiProd1ImpressionEvent;
    this.eventSender.send(gabitoEvent);
    return impressionId;
  }

  logNonAuthImpression(event: UBIImpressionEvent): string {
    const impressionId = uuid();
    const gabitoEvent = ImpressionEventConverter.createGabitoEvent(
      event,
      impressionId,
      this.pageInstanceIdProvider.getPageInstanceId(),
      this.playbackIdProvider?.getPlaybackId() ?? null,
      this.playContextUriProvider?.getPlayContextUri() ?? null,
      false,
    ) as UbiExpr5ImpressionNonAuthEvent;
    this.eventSender.send(gabitoEvent);
    return impressionId;
  }

  logNavigationStart(navigationStartInfo: NavigationStartInfo): void {
    this.pageViewLogger.startNavigation(navigationStartInfo);
  }

  logNavigationEnd(navigationEndInfo: NavigationEndInfo): void {
    this.pageViewLogger.completeNavigation(navigationEndInfo);
  }

  logClientLostFocus(): void {
    if (this.disableAutoBackgroundMonitoring) {
      this.pageViewLogger.logClientLostFocus();
    }
  }

  logClientGainedFocus(): void {
    if (this.disableAutoBackgroundMonitoring) {
      this.pageViewLogger.logClientGainedFocus();
    }
  }

  getPageInstanceId(): string | null {
    return this.pageInstanceIdProvider.getPageInstanceId();
  }
}

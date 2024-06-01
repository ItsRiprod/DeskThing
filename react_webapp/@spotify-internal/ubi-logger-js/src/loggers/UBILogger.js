import { ImpressionEventConverter } from '../eventConverters/ImpressionEventConverter';
import { InteractionEventConverter } from '../eventConverters/InteractionEventConverter';
import { v4 as uuid } from 'uuid';
import { UBIPageInstanceIdProvider, } from '../providers/PageInstanceIdProvider';
import { PageViewLogger } from './PageViewLogger';
export class UBILogger {
    pageInstanceIdProvider;
    playContextUriProvider;
    playbackIdProvider;
    pageViewLogger;
    eventSender;
    disableAutoBackgroundMonitoring;
    constructor(options) {
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
    registerEventListeners() {
        this.pageViewLogger.addEventListeners();
    }
    unregisterEventListeners() {
        this.pageViewLogger.removeEventListeners();
    }
    logInteraction(event) {
        const interactionId = uuid();
        const pageInstanceId = this.pageInstanceIdProvider.getPageInstanceId();
        const gabitoEvent = InteractionEventConverter.createGabitoEvent(event, interactionId, pageInstanceId, this.playbackIdProvider?.getPlaybackId() ?? null, this.playContextUriProvider?.getPlayContextUri() ?? null, true);
        this.eventSender.send(gabitoEvent);
        return interactionId;
    }
    logNonAuthInteraction(event) {
        const interactionId = uuid();
        const gabitoEvent = InteractionEventConverter.createGabitoEvent(event, interactionId, this.pageInstanceIdProvider.getPageInstanceId(), this.playbackIdProvider?.getPlaybackId() ?? null, this.playContextUriProvider?.getPlayContextUri() ?? null, false);
        this.eventSender.send(gabitoEvent);
        return interactionId;
    }
    logImpression(event) {
        const impressionId = uuid();
        const gabitoEvent = ImpressionEventConverter.createGabitoEvent(event, impressionId, this.pageInstanceIdProvider.getPageInstanceId(), this.playbackIdProvider?.getPlaybackId() ?? null, this.playContextUriProvider?.getPlayContextUri() ?? null, true);
        this.eventSender.send(gabitoEvent);
        return impressionId;
    }
    logNonAuthImpression(event) {
        const impressionId = uuid();
        const gabitoEvent = ImpressionEventConverter.createGabitoEvent(event, impressionId, this.pageInstanceIdProvider.getPageInstanceId(), this.playbackIdProvider?.getPlaybackId() ?? null, this.playContextUriProvider?.getPlayContextUri() ?? null, false);
        this.eventSender.send(gabitoEvent);
        return impressionId;
    }
    logNavigationStart(navigationStartInfo) {
        this.pageViewLogger.startNavigation(navigationStartInfo);
    }
    logNavigationEnd(navigationEndInfo) {
        this.pageViewLogger.completeNavigation(navigationEndInfo);
    }
    logClientLostFocus() {
        if (this.disableAutoBackgroundMonitoring) {
            this.pageViewLogger.logClientLostFocus();
        }
    }
    logClientGainedFocus() {
        if (this.disableAutoBackgroundMonitoring) {
            this.pageViewLogger.logClientGainedFocus();
        }
    }
    getPageInstanceId() {
        return this.pageInstanceIdProvider.getPageInstanceId();
    }
}
